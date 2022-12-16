const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/custom-error");
const RepoSchema = require("../models/repo");
const IssueSchema = require("../models/issue");

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
      let formalLength = Object.keys(order).length;
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
      let formalLength = Object.keys(order).length;
      order[formalLength.toString()] = date;
      date_sum_issue[date]=issue_frequency[i].sum;
    }
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
  let committer = new Map;
  for (var i in Msg.data) {
    var t = Msg.data[i].commit.committer.date.substring(0, 10);
    let formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
      let temp=new Map;
      temp.set(Msg.data[i].commit.author.name,1);
      committer.set(t,temp);
    } else {
      result[t] += 1;
      let temp=committer.get(t);
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
  let issuer = new Map;
  for (var i in Msg.data) {
    var t = Msg.data[i].created_at.substring(0, 10);
    let formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
      let temp=new Map;
      temp.set(Msg.data[i].user.login,1);
      issuer.set(t,temp);
    } else {
      result[t] += 1;
      let temp=issuer.get(t);
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
    var final = result;
    var length = 0;
    for(var obj in result){
      length++;
    }
    if(length>50){
      final = CountbyWeek(result)
    }
    length = 0;
    for(var obj in final){
      length++;
    }
    if(length>50){
      final = CountbyMonth(result)
    }
    //console.log(final)
    res.status(201).json(final)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetCommitDevelopment = async(req,res)=>{
  try{
    var result = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    const commit = repo[0].commit_frequency;
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    for ( var i = 0; i <commit.length; i++){
      if(commit[i].date >= begin && commit[i].date <= end){
        if(result[commit[i].date]===undefined){
          result[commit[i].date] = 0;
        }
        result[commit[i].date] += Number(commit[i].sum);
      }
    }
    var final = result;
    var length = 0;
    for(var obj in result){
      length++;
    }
    if(length>50){
      final = CountbyWeek(result)
    }
    length = 0;
    for(var obj in final){
      length++;
    }
    if(length>50){
      final = CountbyMonth(result)
    }
    //console.log(final)
    res.status(201).json(final)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetIssueDevelopment = async(req,res)=>{
  try{
    var result = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
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
    var final = result;
    var length = 0;
    for(var obj in result){
      length++;
    }
    if(length>50){
      final = CountbyWeek(result)
    }
    length = 0;
    for(var obj in final){
      length++;
    }
    if(length>50){
      final = CountbyMonth(result)
    }
    //console.log(final)
    res.status(201).json(final)
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
  let company = new Map;
  let user = new Map;
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
        answer[i]['name'] = repo[i].name
        answer[i]['forks'] = repo[i].forks
        answer[i]['stars'] = repo[i].stars
        answer[i]['open_issues'] = repo[i].open_issues
        answer[i]['community_contributor'] = repo[i].community.contributor
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
    if(repo[0].name==='pytorch'){
      console.log('pytorch')
      issues = await IssueSchema.find()
      console.log(issues)
    }
    else{
      console.log("other");
      issues = repo[0].issue;
    }
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    for ( var i = 0; i <issues.length; i++){
      if((issues[i].title!==null&&(issues[i].title.toString().toUpperCase().search(info.keyword.toString().toUpperCase()) !== -1))||(issues[i].body!==null&&(issues[i].body.toString().toUpperCase().search(info.keyword.toString().toUpperCase()) !== -1))){
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
    var final = result;
    var length = 0;
    for(var obj in result){
      length++;
    }
    if(length>50){
      final = CountbyWeek(result)
    }
    length = 0;
    for(var obj in final){
      length++;
    }
    if(length>50){
      final = CountbyMonth(result)
    }
    res.status(201).json(final)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetAllCommits = async(req,res)=>{
    try{
    var result = {}
    console.log(req.body)
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
     var dic = {}
    // var i = 0;
    var res2 = Object.keys(result).sort(function(a,b){
      // console.log(result[a])
      // console.log(result[b])
      return result[b]-result[a];
    });
    //console.log("------------------res2---------------\n"+res2+"------------------res2---------------\n");
    for(var name in res2){
      //console.log(res2[name])
      dic[res2[name]] = Number(result[res2[name]]);
    }
    console.log(dic)
    res.status(201).json(dic)
  }
  catch(err)
  {
    res.status(404).json(err)
  }
}
const GetAllIssues = async(req,res)=>{
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
        var final = result;
        var length = 0;
        for(var obj in result){
          length++;
        }
        if(length>30){
          final = CountbyWeek(result)
        }
        length = 0;
        for(var obj in final){
          length++;
        }
        if(length>50){
          final = CountbyMonth(result)
        }
        res.status(201).json(final)
      }
      catch(err)
      {
        res.status(404).json(err)
      }
    }
const CountbyWeek = (dataByDay)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
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
    //console.log(beforedate)
    for(var j = 0;j<=6;j++){
      if(temp[String(i-j)]!==undefined){
        var afterdate = String(beforedate).substring(0, 10);
        //console.log(afterdate)
        if(result[afterdate] === undefined){
          result[afterdate] = 0;
        }
        result[afterdate] += Number(dataByDay[temp[String(i-j)]]);
      }
    }
    if(result[String(beforedate).substring(0, 10)] === undefined){
      result[String(beforedate).substring(0, 10)] = 0;
    }
  }
  //console.log(result);
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
  return result;
}

const CountbyYear = (dataByDay)=>{               //传递如下dataByDay样式参数，可以转换为以星期为单位的数据
  var result = {};
  for(var date in dataByDay){
    var year = date.substring(0,4)+"-01-01";
    if(result[String(year)]===undefined){
      result[String(year)] = 0
    }
    result[String(year)] += Number(dataByDay[date]);
  }

  //console.log(result);
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
    

  //console.log(result);
  return result;
}


const DesignAnalysis = async(req,res)=>{
  //6399c719c62122b82210de84
  //63981728399f1e9bbd21d89b //pytorch
  //console.log('into')
  try{
    var result = {"code":{},"maintainability":{},"testing":{},"robustness":{},"preformance":{},"configuration":{},"documentation":{},"clarification":{}};
    var keyword = {"code":["cod","implement"],
                   "maintainability":["maintain","future","plan","os","support","standard"],
                   "testing":["test","bug"],"robustness":["robust","safe","security"],
                   "preformance":["preform","runtime","potimi"],
                   "configuration":["config","flag","option"],
                   "documentation":["document","file"],
                   "clarification":["clarif","question","answer"]};

    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    var issues
    if(repo[0].name==='pytorch'){
      console.log('pytorch')
      issues = await IssueSchema.find()
      //console.log(issues)
    }
    else{
      console.log("other");
      issues = repo[0].issue;
    }
    
    var begin = info.begin;
    var end = info.end;
    if(begin === ''){
      begin = '1970-01-01';
    }
    if(end === ''){
      end = '2024-01-01';
    }
    console.log(begin)
    console.log(end)
    for ( var i = 0; i <issues.length; i++){
      var t = issues[i].created_at.substring(0, 10);
      if(t >= begin && t <= end){
        for(var words in keyword){
          if(result[words][t]===undefined){
            result[words][t] = 0;
          }
          for(var j = 0;j<keyword[words].length;j++){
            if((issues[i].title!==null&&(issues[i].title.toString().toUpperCase().search(keyword[words][j].toString().toUpperCase()) !== -1))||(issues[i].body!==null&&(issues[i].body.toString().toUpperCase().search(keyword[words][j].toUpperCase()) !== -1))){
              if(t >= begin && t <= end){
                result[words][t] += 1;
              }
              break;
            }
          }
        }
      }
    }
    //console.log(result);
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
const NameAnalysis = async()=>{
  let name = require('../name.json');
  let new_name=[];
  let name_day=new Map;
  for (let i = 0; i < name.length; i++) {
    if (!name_day.has(name[i].name)){
      name_day.set(name[i].name,name[i].day);
      let one_new={
        name:name[i].name,
        day:name[i].day,
        number:name[i].number
      }
      new_name.push(one_new)
    }
    else {
      if (name_day.get(name[i].name)+1<name[i].day){
        for (let j = name_day.get(name[i].name)+1; j < name[i].day; j++) {
          let one_new={
            name:name[i].name,
            day:j,
            number:"0"
          }
          new_name.push(one_new)
        }
        let one_new={
          name:name[i].name,
          day:name[i].day,
          number:name[i].number
        }
        new_name.push(one_new)
        name_day.set(name[i].name,name[i].day);
      }
    }
  }
  console.log("new_name",new_name);
  return new_name;
}
const CompanyInfo = async(req,res)=>{
  try{
    var result = {};
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    //console.log(repo[0].company)
    const company = repo[0].company[0];
    
    //console.log(company)
    var final = {};
    for(var name in company){
     //console.log(temp)
      var temp = name;
      var temp1 = temp.replaceAll(",","");
      var temp2 = temp1.replaceAll("-"," ");
      var temp3 = temp2.replaceAll("@","");
      var temp4 = temp3.replaceAll("www.","");
      var temp5 = temp4.replaceAll("inc","");
      var temp6 = temp5.replaceAll(".com","");
      var temp7 = temp6.replaceAll(".cn/","");
      var temp8 = temp7.replaceAll(".cn","");
      var temp9 = temp8.replaceAll(".eu/","");
      var temp10 = temp9.replaceAll(".eu","");
      var temp11 = temp10.replaceAll(".","");
      var temp12 = temp11.replaceAll("https://","");
      var temp13 = temp12.replaceAll("http://","");
      var temp14 = temp13.replaceAll(/\(.*?\)/g, '' );
      var temp15 = temp14.replaceAll(/\{.*?\}/g, '' );
      var temp16 = (temp15.replaceAll("Inc","")).trim();
      if(final[temp16]===undefined){
        final[temp16] = 0;
      }
      final[temp16] += Number(company[name]);
    } 
    console.log(final);
    var result = {};
    for(var name in final){
      result[name.toLowerCase()] = 0;
    }
    for(var name in final){
      for(var resultname in result){
        if(resultname===' '||resultname===''){
          continue;
        }
        if(name.toString().toUpperCase().search(resultname.toUpperCase()) !== -1){
          result[resultname]+=Number(final[name]);
        }
      }
    }
    
    //console.log(result);
    var finalresult = {}
    for(var t in result){
      if(result[t]>1){
        var firstLetter = t.toString().substring(0, 1);
        finalresult[firstLetter.toUpperCase() + t.toString().substring(1)] = Number(result[t]);
      }
    }
    res.status(201).json(finalresult)
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
  CompanyInfo,
  GetCommitDevelopment,
  GetIssueDevelopment
};
