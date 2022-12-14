const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/custom-error");
const RepoSchema = require("../models/repo");
//mongodb b站有教程，有时间我去康康
const ObjectId = require("mongodb").ObjectId;

const { Octokit } = require("@octokit/core");
const res = require("express/lib/response");
const octokit = new Octokit({
  auth: `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`, // token
  auto_paginate: true
});


//
const GetMessage = async (req, res) => {
  try {
    //调用github接获取信息
    const repoMessage = await octokit.request("GET /repos/{owner}/{repo} ", {
      owner: req.body.owner,
      repo: req.body.repoName,
    });
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\nRepo Message:",repoMessage.data,"\n!!!!!!!!!!!!!!!!!!!!!!");
    //这是在干嘛?看起来在插入数据库，应该是这样
    const CreateRepo = await RepoSchema.create({
      name: repoMessage.data.name,
      owner: repoMessage.data.owner.login,
      uploader: req.body.user,
      forks: repoMessage.data.forks,
      stars: repoMessage.data.watchers,
      open_issues: repoMessage.data.open_issues,
      commit_frequency: await RepoGetCommitFrequency(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      issue_frequency: await RepoGetIssueFrequency(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      contributors: await RepoGetContributors(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      community: await RepoGetCommunity(
          repoMessage.data.owner.login,
          repoMessage.data.name
      ),
      issue: await RepoGetIssue(
          repoMessage.data.owner.login,
          repoMessage.data.name
      ),
      company: await RepoGetCompany(
          repoMessage.data.owner.login,
          repoMessage.data.name
      ),
      timeline: {
        created_at: repoMessage.data.created_at,
        updated_at: repoMessage.data.updated_at,
        pushed_at: repoMessage.data.pushed_at,
        recent_released_at: await RepoGetReleaseTime(
          repoMessage.data.owner.login,
          repoMessage.data.name
        ),
      },
      language: await RepoGetLanguage(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
    });
    console.log("11111111111111111111111")
    res.status(201).json({ status: "success!" });
  } catch (err) {
    console.log("error:",err);
    res.status(404).json(err);
  }
};

//搜索repo
const SearchRepoName = async (req, res) => {
  try {
    //不清楚这个req.body里面有啥，但是可以确定 RepoSchema是定义好的访问数据库的实体，调用的是nodejs mongodb库的函数 trim函数移除两侧空白字符
    const SearchKey = req.body.search.trim();
    if (SearchKey === "") {
      var search = await RepoSchema.find({});
    } else
    {
      search = await RepoSchema.find({
        name : { $regex : SearchKey, $options: 'i'}
      });
    }
    //{ '$regex': SearchKey, $options: "$i" }
      // console.log(search)
    var repos = [];
    for (var i in search) {
      var eachRepo = {
        _id: search[i]._id.toString(),
        name: search[i].name,
        owner: search[i].owner,
        stars: search[i].stars,
        uploader: search[i].uploader,
        uploaded_time: search[i]._id.getTimestamp(),
      };
      repos.push(eachRepo);
    }
    // console.log(repos,"?");
    return res.status(201).json({ repos });
  } catch (err) {
    // console.log("!!!")
    res.status(404).json(err);
  }
};

//根据id搜索
const GetDashboard = async (req, res) => {
  try {
    const detail = await RepoSchema.findOne({ _id: ObjectId(req.body.id) });
    let commit_frequency=detail.commit_frequency;
    let date_sum_commit={}
    let order={};
    for (let i = 0; i < commit_frequency.length; i++) {
      let date=commit_frequency[i].date.substring(0,10);
      formalLength = Object.keys(order).length;
      order[formalLength.toString()] = date;
      date_sum_commit[date]=commit_frequency[i].sum;
    }
    console.log("date_sum_commit",date_sum_commit);
    detail.commit_frequency=date_sum_commit;
    let issue_frequency=detail.issue_frequency;
    let date_sum_issue={}
    order={};
    for (let i = 0; i < issue_frequency.length; i++) {
      let date=issue_frequency[i].date.substring(0,10);
      formalLength = Object.keys(order).length;
      order[formalLength.toString()] = date;
      date_sum_issue[date]=issue_frequency[i].sum;
    }
    console.log("date_sum_issue",date_sum_issue);
    detail.issue_frequency=date_sum_issue;
    res.status(201).json({ detail });
  } catch (err) {
    res.status(404).json(err);
  }
};
//根据id删除
const DeleteRepo = async (req, res) => {
  try {
    if(req.body.category === 'common')
    {
      return res.status(201).json({msg : "fail!"})
    }
    const test = await RepoSchema.deleteOne({ _id: ObjectId(req.body.id) });
    res.status(201).json({ msg: "success!" });
  } catch (err) {
    res.status(404).json(err);
  }
};
//获取提交的频率
const RepoGetCommitFrequency = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/commits",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );
  // console.log("\n\ncommits:",repoMessage.data,"\n\n")
  //获取commits数，看起来这个接口一下只能获取一页的数据，用循环的方式去查看有没有下一页
  if (repoMessage.data.length === 0) return { 2022: "0", 2021: "0", 2020: "0" };
  let count=2;
  while (true) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/commits  ",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: count,
      }
    );
    if (NextRepoMessage.data.length === 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
    count++;
  }
  var frequency = {};
  frequency = CountDayCommit(repoMessage);
  return frequency;
};

//统计日提交
const CountDayCommit = (Msg) => {
  var order = {};
  var result = {};
  committer = new Map;
  for (var i in Msg.data) {
    var t = Msg.data[i].commit.committer.date.substring(0, 10);
    formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
      temp=new Map;
      temp.set(Msg.data[i].commit.author.name,1);
      committer.set(t,temp);
    } else {
      result[t] += 1;
      temp=committer.get(t);
      if (temp.has(Msg.data[i].commit.author.name)){
        temp.set(Msg.data[i].commit.author.name,temp.get(Msg.data[i].commit.author.name)+1);
      }
      else{
        temp.set(Msg.data[i].commit.author.name,1);
      }
      committer.set(t,temp);
    }
  }
  var total=[];
  for (const resultKey in result) {
    var oneday={};
    oneday.date=resultKey;
    oneday.sum=result[resultKey];
    oneday.committer=committer.get(resultKey);
    total.push(oneday);
  }
  return total;
};

//获取Issue频率
const RepoGetIssueFrequency = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/issues  ",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );
  //和前面同理
  if (repoMessage.data.length === 0) return { 2022: "0", 2021: "0", 2020: "0" };
  let count=2;
  while (true) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/issues  ",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: count,
      }
    );
    if (NextRepoMessage.data.length === 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
    count++;
  }
  var frequency = {};
  frequency = CountDayIssue(repoMessage);
  return frequency;
};
//和前面同理
const CountDayIssue = (Msg) => {
  var order = {};
  var result = {};
  issuer = new Map;
  for (var i in Msg.data) {
    var t = Msg.data[i].created_at.substring(0, 10);
    formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
      temp=new Map;
      temp.set(Msg.data[i].user.login,1);
      issuer.set(t,temp);
    } else {
      result[t] += 1;
      temp=issuer.get(t);
      if (temp.has(Msg.data[i].user.login)){
        temp.set(Msg.data[i].user.login,temp.get(Msg.data[i].user.login)+1);
      }
      else{
        temp.set(Msg.data[i].user.login,1);
      }
      issuer.set(t,temp);
    }
  }
  var total=[];
  for (const resultKey in result) {
    var oneday={};
    oneday.date=resultKey;
    oneday.sum=result[resultKey];
    oneday.issuer=issuer.get(resultKey);
    total.push(oneday);
  }
  return total;
};

const RepoGetContributors = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/contributors",
    {
      owner: owner,
      repo: name,
    }
  );
  var result = [];
  for (
    var i = 0;
    i < (repoMessage.data.length < 5 ? repoMessage.data.length : 5);
    i++
  ) {
    const userMessage = await octokit.request("GET /users/{username}", {
      username: repoMessage.data[i].login,
    });
    var ss = {
      name: repoMessage.data[i].login,
      avatar_url: repoMessage.data[i].avatar_url,
      contributions: repoMessage.data[i].contributions,
      company: userMessage.data.company,
      public_repos: userMessage.data.public_repos,
      public_gists: userMessage.data.public_gists,
      followers: userMessage.data.followers,
      created_at: userMessage.data.created_at,
    };
    result.push(ss);
  }
  return result;
};

const RepoGetReleaseTime = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/releases",
    {
      owner: owner,
      repo: name,
    }
  );
  if (!repoMessage.data.length) return "not published yet!";
  return repoMessage.data[0].published_at;
};

const RepoGetLanguage = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/languages",
    {
      owner: owner,
      repo: name,
    }
  );
  return repoMessage.data;
};

const RepoGetCommunity = async (owner, name) => {
  const contributorMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/contributors ",
      {
        anon: true,
        owner: owner,
        repo: name,
        per_page: 100,
        page: 1
      }
  );
  let count=2;
  while (true){
    const NextRepoMessage = await octokit.request(
        "GET /repos/{owner}/{repo}/contributors ",
        {
            anon: true,
            owner: owner,
            repo: name,
            per_page: 100,
            page: count
        }
    );
    if (NextRepoMessage.data.length === 0) break;
    else contributorMessage.data = contributorMessage.data.concat(NextRepoMessage.data);
    count++;
  }
  //console.log("count",count)
  const issueMessage = await octokit.request(
      "GET /repos/{owner}/{repo}  ",
      {
          anon: true,
          owner: owner,
          repo: name,
      }
  );
  return {
    contributor: contributorMessage.data.length,
    issuer: issueMessage.data.open_issues_count
  };
};
const GetCommunityDevelopment = async(req,res)=>{
//   const commit = [{"date": "2022-12-13", "sum": ("21"), "committer": {"ecao": ("1"), "Jiewen Tan": ("2"), "Andrew Gu": ("1"), "XiaobingSuper": ("1"), "Andrew M. James": ("1"), "Jithun Nair": ("1"), "mantaionut": ("1"), "soulitzer": ("1"), "Wanchao Liang": ("5"), "Eli Uriegas": ("1"), "PyTorch MergeBot": ("2"), "Driss Guessous": ("1"), "Sergii Dymchenko": ("1"), "Jerry Zhang": ("1"), "Kevin Wang": ("1")}}, 
//   {"date": "2022-12-12", "sum": ("28"), "committer": {"soulitzer": ("1"), "William Wen": ("1"), "Philip Meier": ("1"), "Laurent Mazare": ("1"), "Yanbo Liang": ("2"), "HDCharles": ("1"), "Catherine Lee": ("1"), "BowenBao": ("2"), "Jeff Daily": ("1"), "Soumith Chintala": ("1"), "Aaron Gokaslan": ("1"), "Peter Bell": ("1"), "Sean Ross-Ross": ("1"), "PyTorch MergeBot": ("2"), "Edward Z. Yang": ("5"), "Michael Voznesensky": ("1"), "Yuxin Wu": ("1"), "XiaobingSuper": ("1"), "Bert Maher": ("3")}}, 
// {"date": "2022-12-11", "sum": ("17"), "committer": {"Yuxin Wu": ("2"), "Michael Voznesensky": ("2"), "Edward Z. Yang": ("2"), "Aaron Gokaslan": ("2"), "Jiong Gong": ("1"), "PyTorch MergeBot": ("1"), "Shen Li": ("2"), "Andrew Gu": ("4"), "Rohan Varma": ("1")}}, 
// {"date": "2022-12-10", "sum": ("21"), "committer": {"Andrew Gu": ("1"), "Shen Li": ("1"), "Aaron Gokaslan": ("2"), "Sergii Dymchenko": ("1"), "Edward Z. Yang": ("3"), "blzheng": ("1"), "Jiewen Tan": ("1"), "Larry Liu": ("3"), "Zachary DeVito": ("2"), "PyTorch MergeBot": ("1"), "Digant Desai": ("1"), "Yanli Zhao": ("1"), "BowenBao": ("1"), "Wanchao Liang": ("1"), "Sherlock Huang": ("1")}}]
//   //console.log('GetCommunityDevelopment');
//   const issue = [{"date": "2022-12-13", "sum": ("28"), "issuer": {"jphdotam": ("1"), "pytorch-bot[bot]": ("1"), "chunyuan-w": ("2"), "kisseternity": ("1"), "vince62s": ("1"), "kaoalec": ("1"), "Valentine233": ("1"), "vedantroy": ("1"), "HDCharles": ("2"), "desertfire": ("1"), "mrshenli": ("1"), "mnuyens": ("1"), "bertmaher": ("1"), "rohan-varma": ("1"), "kit1980": ("1"), "jansel": ("2"), "SherlockNoMad": ("1"), "wanchaol": ("6"), "BowenBao": ("1"), "pytorchmergebot": ("1")}}, 
//   {"date": "2022-12-12", "sum": ("40"), "issuer": {"jeffdaily": ("2"), "wconstab": ("1"), "eldar": ("1"), "bdhirsh": ("1"), "YassKa71": ("1"), "pearu": ("2"), "shubhambhokare1": ("1"), "voznesenskym": ("1"), "jbschlosser": ("4"), "XilunWu": ("2"), "yhcharles": ("1"), "malfet": ("1"), "mlazos": ("1"), "jxtps": ("1"), "desertfire": ("1"), "richqyz": ("1"), "ZainRizvi": ("1"), "AsiaCao": ("1"), "atalman": ("1"), "Skylion007": ("1"), "andrewor14": ("1"), "nikitaved": ("2"), "jithunnair-amd": ("1"), "moi90": ("1"), "cyyever": ("1"), "IdoAmit198": ("1"), "401qingkong": ("1"), "alanwaketan": ("2"), "kevalmorabia97": ("1"), "yanboliang": ("1"), "awgu": ("1"), "BolunDai0216": ("1")}}, 
//   {"date": "2022-12-11", "sum": ("20"), "issuer": {"ezyang": ("2"), "salilsdesai": ("6"), "Feltenball": ("1"), "H-Huang": ("1"), "awgu": ("2"), "rnwang04": ("1"), "cyyever": ("1"), "voznesenskym": ("5"), "SherlockNoMad": ("1")}}, 
//   {"date": "2022-12-10", "sum": ("19"), "issuer": {"andstor": ("1"), "akharedeepak": ("1"), "tugsbayasgalan": ("1"), "ezyang": ("1"), "Skylion007": ("1"), "nkaretnikov": ("1"), "rohan-varma": ("1"), "mctigger": ("1"), "wyli": ("1"), "ppwwyyxx": ("1"), "fxmarty": ("1"), "leslie-fang-intel": ("1"), "cyyever": ("1"), "knagrecha": ("1"), "XilunWu": ("2"), "kit1980": ("1"), "zdevito": ("1"), "awgu": ("1")}}, 
//   {"date": "2022-12-09", "sum": ("49"), "issuer": {"knagrecha": ("1"), "zou3519": ("1"), "wconstab": ("2"), "JulesGM": ("1"), "davidberard98": ("1"), "swolchok": ("1"), "HDCharles": ("2"), "desertfire": ("2"), "zdevito": ("1"), "kit1980": ("1"), "eellison": ("1"), "mikekgfb": ("2"), "vadimkantorov": ("2"), "bdhirsh": ("2"), "min-jean-cho": ("1"), "vkuzo": ("1"), "diegogranziol": ("1"), "netw0rkf10w": ("2"), "Flamefire": ("1"), "awgu": ("3"), "MrSherish": ("1"), "H-Huang": ("1"), "javierbg": ("1"), "pmeier": ("1"), "Ascrypto": ("1"), "nikitaved": ("1"), "StevenTang1998": ("1"), "maxcurzi": ("2"), "ronzhou": ("1"), "Juelianqvq": ("1"), "aliencaocao": ("1"), "BLOrange-AMD": ("1"), "Inkorak": ("1"), "vors": ("1"), "cyyever": ("1"), "SOTAMak1r": ("1"), "peterbell10": ("1"), "yCobanoglu": ("1"), "michaelklachko": ("1")}}, 
//   {"date": "2022-12-08", "sum": ("43"), "issuer": {"shingjan": ("1"), "Freed-Wu": ("1"), "mikekgfb": ("1"), "bdhirsh": ("1"), "williamwen42": ("1"), "cijerezg": ("1"), "kurtamohler": ("1"), "rohan-varma": ("2"), "xkszltl": ("1"), "facebook-github-bot": ("1"), "lendle": ("1"), "artkorenev": ("1"), "samdow": ("2"), "vfdev-5": ("1"), "ezyang": ("4"), "felixdivo": ("1"), "MikkelAntonsen": ("1"), "awgu": ("1"), "Vargol": ("1"), "anjali411": ("2"), "justinge": ("1"), "spyroot": ("1"), "kshitij12345": ("1"), "i-a-morozov": ("1"), "yanboliang": ("1"), "astroboylrx": ("1"), "Guitaricet": ("1"), "malfet": ("1"), "wanchaol": ("1"), "tito21": ("1"), "dzhulgakov": ("1"), "collindbell": ("1"), "kevalmorabia97": ("1"), "xw285cornell": ("1"), "jerryzh168": ("1"), "kulinseth": ("1"), "xwang233": ("1")}}]
  //console.log('GetCommunityDevelopment');
  try{
    var result = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    const commit = repo[0].commit_frequency;
    const issue = repo[0].issue_frequency;
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    for ( var i = 0; i <issue.length; i++){
      
      //console.log(result[issue[i].date]);
      if(issue[i].date >= begin && issue[i].date <= end){
        if(result[issue[i].date]===undefined){
          result[issue[i].date] = 0;
        }
        result[issue[i].date] += Number(issue[i].sum);
      }
    }
    for ( var i = 0; i <commit.length; i++){
      if(commit[i].date >= begin && commit[i].date <= end){
        if(result[commit[i].date]===undefined){
          result[commit[i].date] = 0;
        }
        result[commit[i].date] += Number(commit[i].sum);
      }
    }
    res.status(201).json(result)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const RepoGetIssue = async (owner, name) => {
  const issueMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/issues ",
      {
        anon: true,
        owner: owner,
        repo: name,
        per_page: 100,
        page: 1
      }
  );
  let count=2;
  let result=[];
  for (let i = 0; i < issueMessage.data.length; i++) {
    result.push({
      title:issueMessage.data[i].title,
      body:issueMessage.data[i].body,
      created_at:issueMessage.data[i].created_at
    })
  }
  while (true){
    const NextRepoMessage = await octokit.request(
        "GET /repos/{owner}/{repo}/issues ",
        {
          anon: true,
          owner: owner,
          repo: name,
          per_page: 100,
          page: count
        }
    );
    if (NextRepoMessage.data.length === 0) break;
    else {
      for (let i = 0; i < NextRepoMessage.data.length; i++) {
        result.push({
          title:NextRepoMessage.data[i].title,
          body:NextRepoMessage.data[i].body,
          created_at:NextRepoMessage.data[i].created_at
        })
      }
    }
    count++;
  }
  console.log("\n\nissue length:",result.length,"\n\n");

  return result;
};

const RepoGetCompany = async (owner, name) => {
  company = new Map;
  user = new Map;
  let count=1;
  while (count<=10){
    const NextStargazerMessage = await octokit.request(
        "GET /repos/{owner}/{repo}/stargazers ",
        {
          owner: owner,
          repo: name,
          per_page: 100,
          page: count
        }
    );
    if (NextStargazerMessage.data.length===0) break;
    else{
      for (let i = 0; i < NextStargazerMessage.data.length; i++) {
        const userMessage = await octokit.request("GET /users/{username}", {
          username: NextStargazerMessage.data[i].login,
        });
        if (userMessage.data.company!=null&&!user.has(NextStargazerMessage.data[i].login)){
          user.set(NextStargazerMessage.data[i].login,1);
          if (company.has(userMessage.data.company)){
            company.set(userMessage.data.company,company.get(userMessage.data.company)+1);
          }
          else{
            company.set(userMessage.data.company,1);
          }
        }
      }
    }
    count++;
  }
  count=1;
  console.log("\n\nstargazer done!!!\n\n");
  while (count<=10){
    const NextIssueMessage = await octokit.request(
        "GET /repos/{owner}/{repo}/issues ",
        {
          owner: owner,
          repo: name,
          per_page: 100,
          page: count
        }
    );
    if (NextIssueMessage.data.length===0) break;
    else{
      for (let i = 0; i < NextIssueMessage.data.length; i++) {
        const userMessage = await octokit.request("GET /users/{username}", {
          username: NextIssueMessage.data[i].user.login,
        });
        if (userMessage.data.company!=null&&!user.has(NextIssueMessage.data[i].user.login)){
          user.set(NextIssueMessage.data[i].user.login,1);
          if (company.has(userMessage.data.company)){
            company.set(userMessage.data.company,company.get(userMessage.data.company)+1);
          }
          else{
            company.set(userMessage.data.company,1);
          }
        }
      }
    }
    count++;
  }
  console.log("\n\nissuer done!!!\n\n");
  count=1;
  while (count<=10){
    const NextCommitMessage = await octokit.request(
        "GET /repos/{owner}/{repo}/contributors ",
        {
          owner: owner,
          repo: name,
          per_page: 100,
          page: count
        }
    );
    if (NextCommitMessage.data.length===0) break;
    else{
      for (let i = 0; i < NextCommitMessage.data.length; i++) {
        const userMessage = await octokit.request("GET /users/{username}", {
          username: NextCommitMessage.data[i].login,
        });
        if (userMessage.data.company!=null&&!user.has(NextCommitMessage.data[i].login)){
          user.set(NextCommitMessage.data[i].login,1);
          if (company.has(userMessage.data.company)){
            company.set(userMessage.data.company,company.get(userMessage.data.company)+1);
          }
          else{
            company.set(userMessage.data.company,1);
          }
        }
      }
    }
    count++;
  }
  console.log("\n\ncommitter done!!!\n\n");
  return company;
};

const DataRangeChoose = async(req,res)=>{
  try{
    var answer = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    if(info.kind === 'commit_frequency')
    {
      for(var i in repo[0].commit_frequency)
      {
        if(repo[0].commit_frequency[i].date >= info.begin && repo[0].commit_frequency[i].date <= info.end)
        {
          answer[repo[0].commit_frequency[i].date] = repo[0].commit_frequency[i].sum
        }
      }
    }
    else if(info.kind === 'issue_frequency')
    {
      for(var i in repo[0].issue_frequency)
      {
        if(repo[0].issue_frequency[i].date >= info.begin && repo[0].issue_frequency[i].date <= info.end)
        {
          answer[repo[0].issue_frequency[i].date] = repo[0].issue_frequency[i].sum
        }
      }
    }

    if(info.sort === 0)
    {
      var ress =  Object.keys(answer).sort();
      var answer1 = {}
      for(var i in ress)
      {
        answer1[ress[i]] = answer[ress[i]]
      }
      answer = answer1
    }
    else if(info.sort === 1)
    {
      var ress =  Object.keys(answer).sort();
      var answer1 = {}
      for(var i=ress.length-1; i>=0; i--)
      {
        answer1[ress[i]] = answer[ress[i]]
      }
      answer = answer1
    }
    res.status(201).json(answer)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}

const SigCompare = async(req, res)=>{
  try{
    var answer = []
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    console.log(repo)
    if(info.kind === 'commit_frequency')
    {
      for(var j=0; j < info.begin.length; j++)
      {
        answer.push({})
        for(var i in repo[0].commit_frequency)
        {
          if(repo[0].commit_frequency[i].date >= info.begin[j] && repo[0].commit_frequency[i].date <= info.end[j])
          {
            answer[j][repo[0].commit_frequency[i].date] = repo[0].commit_frequency[i].sum
          }
        }
      }
    }
    else if(info.kind === 'issue_frequency')
    {
      for(var j=0; j < info.begin.length; j++)
      {
        answer.push({})
        for(var i in repo[0].issue_frequency)
        {
          if(repo[0].issue_frequency[i].date >= info.begin[j] && repo[0].issue_frequency[i].date <= info.end[j])
          {
            answer[j][repo[0].issue_frequency[i].date] = repo[0].issue_frequency[i].sum
          }
        }
      }
    }
    else if(info.kind === 'contributors')
    {
      answer = repo[0].contributors
    }
    console.log(answer)

    if(info.sort === 0 && info.kind !== 'contributors')
    {
      for(var k=0; k<answer.length; k++)
      {
        var resu =  Object.keys(answer[k]).sort();
        var answer1 = {}
        for(var i in resu)
        {
          answer1[resu[i]] = answer[k][resu[i]]
        }
        answer[k] = answer1
      }
    }
    else if(info.sort === 1 && info.kind !== 'contributors')
    {
      for(var k=0; k<answer.length; k++)
      {
        var resu =  Object.keys(answer[k]).sort();
        var answer1 = {}
        for(var i=resu.length; i>=0; i--)
        {
          answer1[resu[i]] = answer[k][resu[i]]
        }
        answer[k] = answer1
      }
    }

    res.status(201).json(answer)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}

const ComCompare = async(req, res)=>{
  try{
    var answer = []
    const info = req.body
    var repo = []
    for(var i=0; i<info.id.length; i++)
    {
      var repo1 = await RepoSchema.find({_id : info.id[i]})
      repo.push(...repo1)
    }
    if(info.kind === 'commit_frequency')
    {
      for(var i=0; i<repo.length; i++)
      {
        answer.push({})
        for(var j in repo[i].commit_frequency)
        {
          if(repo[i].commit_frequency[j].date >= info.begin && repo[i].commit_frequency[j].date <= info.end)
          {
            answer[i][repo[i].commit_frequency[j].date] = repo[i].commit_frequency[j].sum
          }
        }
      }
    }
    else if(info.kind === 'issue_frequency')
    {
      for(var i=0; i<repo.length; i++)
      {
        answer.push({})
        for(var j in repo[i].issue_frequency)
        {
          if(repo[i].issue_frequency[j].date >= info.begin && repo[i].issue_frequency[j].date <= info.end)
          {
            answer[i][repo[i].issue_frequency[j].date] = repo[i].issue_frequency[j].sum
          }
        }
      }
    }
    else if(info.kind === 'others')
    {
      for(var i=0; i<repo.length; i++)
      {
        answer.push({})
        answer[i]['forks'] = repo[i].forks
        answer[i]['stars'] = repo[i].stars
        answer[i]['open_issues'] = repo[i].open_issues
        answer[i]['community_contributor '] = repo[i].community.contributor
        answer[i]['community_issuer'] = repo[i].community.issuer
      }
    }

    if(info.sort === 0 && info.kind !== 'others')
    {
      for(var k=0; k<answer.length; k++)
      {
        var resu =  Object.keys(answer[k]).sort();
        var answer1 = {}
        for(var i in resu)
        {
          answer1[resu[i]] = answer[k][resu[i]]
        }
        answer[k] = answer1
      }
    }
    else if(info.sort === 1 && info.kind !== 'others')
    {
      for(var k=0; k<answer.length; k++)
      {
        var resu =  Object.keys(answer[k]).sort();
        var answer1 = {}
        console.log(resu)
        for(var i=resu.length-1; i>=0; i--)
        {
          answer1[resu[i]] = answer[k][resu[i]]
        }
        answer[k] = answer1
      }
    }

    res.status(201).json(answer)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}

const GetCertainIssue = async(req,res)=>{
  try{
    var result = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    const issues = repo[0].issue;
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    console.log("-----------------begin::        "+begin+"        ::begin-----------------");
    console.log("-----------------end::        "+end+"        ::end-----------------");
    for ( var i = 0; i <issues.length; i++){
      if((issues[i].title!==null&&(issues[i].title.toString().search(info.keyword.toString()) !== -1))||(issues[i].body!==null&&(issues[i].body.toString().search(info.keyword) !== -1))){
        var t = issues[i].created_at.substring(0, 10);
        if(t >= begin && t <= end){
          if(result[t]===undefined){
            result[t] = 1;
          }
          else{
            result[t] += 1;
          }
        }
      }
    }
    res.status(201).json(result)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetAllCommits = async(req,res)=>{
//   const commits = [{"date": "2022-12-13", "sum": ("21"),
// "committer": {"ecao": ("1"), "Jiewen Tan": ("2"), "Andrew Gu": ("1"), "XiaobingSuper": ("1"), "Andrew M. James": ("1"), "Jithun Nair": ("1"), "mantaionut": ("1"), "soulitzer": ("1"), "Wanchao Liang": ("5"), "Eli Uriegas": ("1"), "PyTorch MergeBot": ("2"), "Driss Guessous": ("1"), "Sergii Dymchenko": ("1"), "Jerry Zhang": ("1"), "Kevin Wang": ("1")}},
// {"date": "2022-12-12", "sum": ("28"), "committer": {"soulitzer": ("1"), "William Wen": ("1"), "Philip Meier": ("1"), "Laurent Mazare": ("1"), "Yanbo Liang": ("2"), "HDCharles": ("1"), "Catherine Lee": ("1"), "BowenBao": ("2"), "Jeff Daily": ("1"), "Soumith Chintala": ("1"), "Aaron Gokaslan": ("1"), "Peter Bell": ("1"), "Sean Ross-Ross": ("1"), "PyTorch MergeBot": ("2"), "Edward Z. Yang": ("5"), "Michael Voznesensky": ("1"), "Yuxin Wu": ("1"), "XiaobingSuper": ("1"), "Bert Maher": ("3")}},
// {"date": "2022-12-11", "sum": ("17"), "committer": {"Yuxin Wu": ("2"), "Michael Voznesensky": ("2"), "Edward Z. Yang": ("2"), "Aaron Gokaslan": ("2"), "Jiong Gong": ("1"), "PyTorch MergeBot": ("1"), "Shen Li": ("2"), "Andrew Gu": ("4"), "Rohan Varma": ("1")}},
// {"date": "2022-12-10", "sum": ("21"), "committer": {"Andrew Gu": ("1"), "Shen Li": ("1"), "Aaron Gokaslan": ("2"), "Sergii Dymchenko": ("1"), "Edward Z. Yang": ("3"), "blzheng": ("1"), "Jiewen Tan": ("1"), "Larry Liu": ("3"), "Zachary DeVito": ("2"), "PyTorch MergeBot": ("1"), "Digant Desai": ("1"), "Yanli Zhao": ("1"), "BowenBao": ("1"), "Wanchao Liang": ("1"), "Sherlock Huang": ("1")}}];
  try{
    var result = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    const commits = repo[0].commit_frequency;
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    for ( var i = 0; i <commits.length; i++){
      if(commits[i].date >= begin && commits[i].date <= end){
        var committers = commits[i].committer;
        for ( var j in committers){
          //console.log(j);
          if(result[j]===undefined){
            result[j] = 0;
          }
          // console.log('commits[i].sum')
          // console.log(commits[i].sum)
          result[j] += Number(committers[j]);
        }
      }
    }
    res.status(201).json(result)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetAllIssues = async(req,res)=>{
//   const issues = [{"date": "2022-12-13", "sum": ("28"), "issuer": {"jphdotam": ("1"), "pytorch-bot[bot]": ("1"), "chunyuan-w": ("2"), "kisseternity": ("1"), "vince62s": ("1"), "kaoalec": ("1"), "Valentine233": ("1"), "vedantroy": ("1"), "HDCharles": ("2"), "desertfire": ("1"), "mrshenli": ("1"), "mnuyens": ("1"), "bertmaher": ("1"), "rohan-varma": ("1"), "kit1980": ("1"), "jansel": ("2"), "SherlockNoMad": ("1"), "wanchaol": ("6"), "BowenBao": ("1"), "pytorchmergebot": ("1")}},
// {"date": "2022-12-12", "sum": ("40"), "issuer": {"jeffdaily": ("2"), "wconstab": ("1"), "eldar": ("1"), "bdhirsh": ("1"), "YassKa71": ("1"), "pearu": ("2"), "shubhambhokare1": ("1"), "voznesenskym": ("1"), "jbschlosser": ("4"), "XilunWu": ("2"), "yhcharles": ("1"), "malfet": ("1"), "mlazos": ("1"), "jxtps": ("1"), "desertfire": ("1"), "richqyz": ("1"), "ZainRizvi": ("1"), "AsiaCao": ("1"), "atalman": ("1"), "Skylion007": ("1"), "andrewor14": ("1"), "nikitaved": ("2"), "jithunnair-amd": ("1"), "moi90": ("1"), "cyyever": ("1"), "IdoAmit198": ("1"), "401qingkong": ("1"), "alanwaketan": ("2"), "kevalmorabia97": ("1"), "yanboliang": ("1"), "awgu": ("1"), "BolunDai0216": ("1")}},
// {"date": "2022-12-11", "sum": ("20"), "issuer": {"ezyang": ("2"), "salilsdesai": ("6"), "Feltenball": ("1"), "H-Huang": ("1"), "awgu": ("2"), "rnwang04": ("1"), "cyyever": ("1"), "voznesenskym": ("5"), "SherlockNoMad": ("1")}},
// {"date": "2022-12-10", "sum": ("19"), "issuer": {"andstor": ("1"), "akharedeepak": ("1"), "tugsbayasgalan": ("1"), "ezyang": ("1"), "Skylion007": ("1"), "nkaretnikov": ("1"), "rohan-varma": ("1"), "mctigger": ("1"), "wyli": ("1"), "ppwwyyxx": ("1"), "fxmarty": ("1"), "leslie-fang-intel": ("1"), "cyyever": ("1"), "knagrecha": ("1"), "XilunWu": ("2"), "kit1980": ("1"), "zdevito": ("1"), "awgu": ("1")}}]
  try{
      var result = {}
      const info = req.body
      const repo = await RepoSchema.find({_id : info.id})
      const issues = repo[0].issue_frequency;
      var begin = info.begin;
      var end = info.end;
      if(begin === ''){
        begin = '1970-01-01';
      }
      if(end === ''){
        end = '2024-01-01';
      }
      for ( var i = 0; i <issues.length; i++){
        if(issues[i].date >= begin && issues[i].date <= end){
          var issuers = issues[i].issuer;
          for ( var j in issuers){
            //console.log(j);
            if(result[j]===undefined){
              result[j] = 0;
            }
            // console.log('issues[i].sum')
            // console.log(issues[i].sum)
            result[j] += Number(issuers[j]);
          }
        }
      }
      res.status(201).json(result)
    }
    catch(err)
    {
      res.status(404).json(err)
    }
  }

  const GetCertainCommitter = async(req,res)=>{
    //   const commits = [{"date": "2022-12-13", "sum": ("21"),
    // "committer": {"ecao": ("1"), "Jiewen Tan": ("2"), "Andrew Gu": ("1"), "XiaobingSuper": ("1"), "Andrew M. James": ("1"), "Jithun Nair": ("1"), "mantaionut": ("1"), "soulitzer": ("1"), "Wanchao Liang": ("5"), "Eli Uriegas": ("1"), "PyTorch MergeBot": ("2"), "Driss Guessous": ("1"), "Sergii Dymchenko": ("1"), "Jerry Zhang": ("1"), "Kevin Wang": ("1")}},
    // {"date": "2022-12-12", "sum": ("28"), "committer": {"soulitzer": ("1"), "William Wen": ("1"), "Philip Meier": ("1"), "Laurent Mazare": ("1"), "Yanbo Liang": ("2"), "HDCharles": ("1"), "Catherine Lee": ("1"), "BowenBao": ("2"), "Jeff Daily": ("1"), "Soumith Chintala": ("1"), "Aaron Gokaslan": ("1"), "Peter Bell": ("1"), "Sean Ross-Ross": ("1"), "PyTorch MergeBot": ("2"), "Edward Z. Yang": ("5"), "Michael Voznesensky": ("1"), "Yuxin Wu": ("1"), "XiaobingSuper": ("1"), "Bert Maher": ("3")}},
    // {"date": "2022-12-11", "sum": ("17"), "committer": {"Yuxin Wu": ("2"), "Michael Voznesensky": ("2"), "Edward Z. Yang": ("2"), "Aaron Gokaslan": ("2"), "Jiong Gong": ("1"), "PyTorch MergeBot": ("1"), "Shen Li": ("2"), "Andrew Gu": ("4"), "Rohan Varma": ("1")}},
    // {"date": "2022-12-10", "sum": ("21"), "committer": {"Andrew Gu": ("1"), "Shen Li": ("1"), "Aaron Gokaslan": ("2"), "Sergii Dymchenko": ("1"), "Edward Z. Yang": ("3"), "blzheng": ("1"), "Jiewen Tan": ("1"), "Larry Liu": ("3"), "Zachary DeVito": ("2"), "PyTorch MergeBot": ("1"), "Digant Desai": ("1"), "Yanli Zhao": ("1"), "BowenBao": ("1"), "Wanchao Liang": ("1"), "Sherlock Huang": ("1")}}];
      try{
        var result = {}
        const info = req.body
        //console.log(info.name)
        const repo = await RepoSchema.find({_id : info.id})
        const commits = repo[0].commit_frequency;

        var begin = info.begin;
        var end = info.end;
        if(begin === ''){
          begin = '1970-01-01';
        }
        if(end === ''){
          end = '2024-01-01';
        }
        for ( var i = 0; i <commits.length; i++){
          if(commits[i].date >= begin && commits[i].date <= end){
            if(info.name in commits[i].committer){
              //console.log('find')
              result[commits[i].date] = Number(commits[i].committer[info.name]);
            }
          }
        }
        res.status(201).json(result)
      }
      catch(err)
      {
        res.status(404).json(err)
      }
    }
const CountbyWeek = (dataByDay)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
  //console.log(Math.floor((Date.parse("2022-12-31") - Date.parse("1970-1-1"))/(1*24*60*60*1000))); //计算一下从2022-12-31到1970-1-1的天数，即目前来说不可能的最大天数
  // const dataByDay = {"2022-12-13": ("19"),
  // "2022-12-12": ("28"),
  // "2022-12-11": ("17"),
  // "2022-12-10": ("21"),
  // "2022-12-09": ("41"),
  // "2022-12-08": ("65"), "2022-12-07": ("36"), "2022-12-06": ("62"),
  // "2022-12-05": ("27"), "2022-12-04": ("9"), "2022-12-03": ("13"),
  // "2022-12-02": ("42"), "2022-12-01": ("49"), "2022-11-30": ("61"),
  // "2022-11-29": ("39"), "2022-11-28": ("49"), "2022-11-27": ("12"),
  // "2022-11-26": ("3"), "2022-11-25": ("15"), "2022-11-24": ("32"),
  // "2022-11-23": ("50"), "2022-11-22": ("44"), "2022-11-21": ("25"),
  // "2022-11-20": ("6"), "2022-11-19": ("21"), "2022-11-18": ("50"),
  // "2022-11-17": ("52"), "2022-11-16": ("63"), "2022-11-15": ("46"),
  // "2022-11-14": ("30"), "2022-11-13": ("15"), "2022-11-12": ("20"),
  //  "2022-11-11": ("44"), "2022-11-10": ("49"), "2022-11-09": ("40"),
  //   "2022-11-08": ("41"), "2022-11-07": ("35"), "2022-11-06": ("1"),
  //   "2022-11-05": ("12"), "2022-11-04": ("38"), "2022-11-03": ("54"),
  //    "2022-11-02": ("78"), "2022-11-01": ("56"), "2022-10-31": ("45"),
  //     "2022-10-30": ("5"), "2022-10-29": ("25"), "2022-10-28": ("48"),
  //     "2022-10-27": ("35"), "2022-10-26": ("57"), "2022-10-25": ("54"),
  //     "2022-10-24": ("43"), "2022-10-23": ("8"), "2022-10-22": ("10"),
  //     "2022-10-21": ("49"), "2022-10-20": ("41"), "2022-10-19": ("44"),
  //     "2022-10-18": ("52"), "2022-10-17": ("42"), "2022-10-16": ("10"),
  //     "2022-10-15": ("16"), "2022-10-14": ("38"), "2022-10-13": ("58"),
  //     "2022-10-12": ("36"), "2022-10-11": ("49"), "2022-10-10": ("29"),
  //     "2022-10-09": ("10"), "2022-10-08": ("12"), "2022-10-07": ("51"),
  //     "2022-10-06": ("46"), "2022-10-05": ("36"), "2022-10-04": ("21"),
  //     "2022-10-03": ("56"), "2022-10-02": ("17"), "2022-10-01": ("11"), "2022-09-30": ("61"), "2022-09-29": ("50"), "2022-09-28": ("68"), "2022-09-27": ("52"), "2022-09-26": ("22"), "2022-09-25": ("9"), "2022-09-24": ("15"), "2022-09-23": ("50"), "2022-09-22": ("32"), "2022-09-21": ("50"), "2022-09-20": ("29"), "2022-09-19": ("25"), "2022-09-18": ("4"), "2022-09-17": ("27"), "2022-09-16": ("44"), "2022-09-15": ("33"), "2022-09-14": ("34"), "2022-09-13": ("39"), "2022-09-12": ("32"), "2022-09-11": ("1"), "2022-09-10": ("13"), "2022-09-09": ("47"), "2022-09-08": ("30"), "2022-09-07": ("43"), "2022-09-06": ("31"), "2022-09-05": ("11"), "2022-09-04": ("2"), "2022-09-03": ("4"), "2022-09-02": ("21"), "2022-09-01": ("48"), "2022-08-31": ("34"), "2022-08-30": ("41"), "2022-08-29": ("35"), "2022-08-28": ("13"), "2022-08-27": ("11"), "2022-08-26": ("34"), "2022-08-25": ("43"), "2022-08-24": ("50"), "2022-08-23": ("43"), "2022-08-22": ("42"), "2022-08-21": ("7"), "2022-08-20": ("9"), "2022-08-19": ("51"), "2022-08-18": ("44"), "2022-08-17": ("45"), "2022-08-16": ("51"), "2022-08-15": ("23"), "2022-08-14": ("3"), "2022-08-13": ("12"), "2022-08-12": ("34"), "2022-08-11": ("43"), "2022-08-10": ("48"), "2022-08-09": ("37"), "2022-08-08": ("42"), "2022-08-07": ("10"), "2022-08-06": ("21"), "2022-08-05": ("39"), "2022-08-04": ("43"), "2022-08-03": ("51"), "2022-08-02": ("34"), "2022-08-01": ("33"), "2022-07-31": ("2"), "2022-07-30": ("8"), "2022-07-29": ("35")};

  var basedate = "1970-01-01";
  var days = 0;
  var result = {};
  var temp = {};
  var max = 0;
  var min = 20000;
  // var test = new Date(19357 * 1*24*60*60*1000);
  // console.log(test)
  for(var date in dataByDay){
    var  startDate = Date.parse(basedate);
    var  endDate = Date.parse(date);
    if (startDate>endDate){
        days = 0;
    }
    if (startDate==endDate){
        days = 1;
    }
    days=Math.floor((endDate - startDate)/(1*24*60*60*1000));
    if(max<days){
      max = days;
    }
    if(min>days){
      min = days;
    }
    temp[String(days)] = date;
  }

 // console.log(days);
  for(var i = max;i>=min;i = i-7){
    var tempdate = new Date(i * 1*24*60*60*1000);
    var beforedate = tempdate.toISOString()
    //console.log(finaldate);
    for(var j = 0;j<=6;j++){
      if(temp[String(i-j)]!==undefined){
        var afterdate = String(beforedate).substring(0, 10);
        if(result[afterdate] === undefined){
          result[afterdate] = 0;
        }
        result[afterdate] += Number(dataByDay[temp[String(i-j)]]);
      }
    }
  }
  console.log(result);
  return result;
}

const CountbyMonth = (dataByDay)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
  var result = {};
  for(var date in dataByDay){
    var month = date.substring(0,7);
    if(result[String(month)]===undefined){
      result[String(month)] = 0
    }
    result[String(month)] += Number(dataByDay[date]);
  }

  console.log(result);
  return result;
}

const CountbyYear = (dataByDay)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
  var result = {};
  for(var date in dataByDay){
    var year = date.substring(0,4);
    if(result[String(year)]===undefined){
      result[String(year)] = 0
    }
    result[String(year)] += Number(dataByDay[date]);
  }

  console.log(result);
  return result;
}


const SelectRange = (dataByDay,begin,end)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
  // const begin = "2022-10-25";
  // const end = "2022-12-01";
  var result = {};
  for(var date in dataByDay){
    if(date>=String(begin)&&date<=String(end)){
      result[String(date)] = Number(dataByDay[date]);
    }
  }
    

  console.log(result);
  return result;
}


const DesignAnalysis = async(req,res)=>{
  console.log('into')
  try{
    var result = {"code":{},"maintainability":{},"testing":{},"robustness":{},"preformance":{},"configuration":{},"documentation":{},"clarification":{}};
    var keyword = {"code":["code","implement"],
                   "maintainability":["maintain","future","plan","os","support","standard"],
                   "testing":["test"],"robustness":["robust","safe","security"],
                   "preformance":["preform","runtime","potimi"],
                   "configuration":["config","flag","option"],
                   "documentation":["document","file"],
                   "clarification":["clarif","question","answer"]};

    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    const issues = repo[0].issue;
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    for ( var i = 0; i <issues.length; i++){
      var t = issues[i].created_at.substring(0, 10);
      console.log(issues[i].title)
      //console.log(issues[i].title.toString().search("test")!= -1)
      for(var words in keyword){
        if(result[words][t]===undefined){
          result[words][t] = 0;
        }
        //console.log(words)
        for(var j = 0;j<keyword[words].length;j++){
          //console.log(keyword[words][j].toString())
          //console.log((issues[i].title.toString().search(keyword[words][j].toString()) !== -1));
          if((issues[i].title!==null&&(issues[i].title.toString().search(keyword[words][j].toString()) !== -1))||(issues[i].body!==null&&(issues[i].body.toString().search(keyword[words][j]) !== -1))){
            //console.log('find'+j);
            if(t >= begin && t <= end){
              result[words][t] += 1;
            }
            break;
          }
        }
      }
    }
    console.log(result);
    var final = {"code":{},"maintainability":{},"testing":{},"robustness":{},"preformance":{},"configuration":{},"documentation":{},"clarification":{}};
    final["code"] = CountbyWeek(result["code"]);
    final["maintainability"] = CountbyWeek(result["maintainability"]);
    final["testing"] = CountbyWeek(result["testing"]);
    final["robustness"] = CountbyWeek(result["robustness"]);
    final["preformance"] = CountbyWeek(result["preformance"]);
    final["configuration"] = CountbyWeek(result["configuration"]);
    final["documentation"] = CountbyWeek(result["documentation"]);
    final["clarification"] = CountbyWeek(result["clarification"]);
    res.status(201).json(final)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}


module.exports = {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
  DataRangeChoose,
  GetCommunityDevelopment,
  SigCompare,
  ComCompare,
  GetCertainIssue,
  GetAllCommits,
  GetAllIssues,
  GetCertainCommitter,
  DesignAnalysis,
};
