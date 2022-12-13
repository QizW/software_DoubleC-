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
    res.status(201).json({ detail });
  } catch (err) {
    res.status(404).json(err);
  }
};
//根据id删除
const DeleteRepo = async (req, res) => {
  try {
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
  //console.log('GetCommunityDevelopment');
  try{
    // console.log(req.body)
    var result = {}
    const info = req.body
    //console.log(req.body)
    const repo = await RepoSchema.find({_id : info.id})
    const commit = repo[0].commit_frequency;
    const issue = repo[0].issue_frequency;
    for(var i in issue){
      console.log(result[i]);
      if(i >= info.begin && i <= info.end){
        if(result[i]===undefined){
          result[i] = 0;
        }
        result[i] += issue[i];
      }
    }
    for(var i in commit){
      if(i >= info.begin && i <= info.end){
        console.log('compare')
        if(result[i]===undefined){
          result[i] = 0;
        }
        result[i] += commit[i];
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


const DataRangeChoose = async(req,res)=>{
  try{
    // console.log(req.body)
    var answer = {}
    const info = req.body
    const repo = await RepoSchema.find({_id : info.id})
    if(info.kind === 'commit_frequency')
    {
      for(var i in repo[0].commit_frequency)
      {
        if(i >= info.begin && i <= info.end)
        {
          answer[i] = repo[0].commit_frequency[i]
        }
      }
    }
    else if(info.kind === 'issue_frequency')
    {
      for(var i in repo[0].issue_frequency)
      {
        if(i >= info.begin && i <= info.end)
        {
          answer[i] = repo[0].issue_frequency[i]
        }
      }
    }

    if(info.sort === 0)
    {
      res =  Object.keys(answer).sort();
      var answer1 = {}
      for(var i in res)
      {
        answer1[res[i]] = answer[res[i]]
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
const GetCertainIssue = async(req,res)=>{
  // const issues = [
  // {"title": "Importing torch causes segfault when using python installed with conda", 
  // "body": "### \uD83D\uDC1B Describe the bug\n\nCross-posted to: https://discuss.pytorch.org/t/importing-torch-causes-segfault-when-using-python-installed-with-conda/168212\r\n\r\nI create a conda environment with: `conda create -y -n dev python=3.7`.\r\nIn install torch with:\r\n```\r\nconda run -n dev pip install torch==1.14.0.dev20221027+cu116 --pre --extra-index-url https://download.pytorch.org/whl/nightly/cu116\r\n```\r\n\r\nrunning: `python3 -c import torch` gives a segfault.\r\nHere's the gdb backtrace:\r\n\r\n```\r\n-c (gdb) r -c 'import torch'\r\nStarting program: /opt/conda/envs/dev/bin/python3 -c 'import torch'\r\n[Thread debugging using libthread_db enabled]\r\nUsing host libthread_db library \"/lib/x86_64-linux-gnu/libthread_db.so.1\".\r\n[Detaching after fork from child process 31265]\r\n\r\nProgram received signal SIGSEGV, Segmentation fault.\r\n0x000055555564d27c in type_name (context=<optimized out>, type=0x555558aa7630)\r\n    at /home/conda/feedstock_root/build_artifacts/python_1635226063427/work/Objects/typeobject.c:433\r\n433\t/home/conda/feedstock_root/build_artifacts/python_1635226063427/work/Objects/typeobject.c: No such file or directory.\r\n```\n\n### Versions\n\nThe script segfaults.", 
  // "created_at": "2022-12-13T06:10:38Z"}, 
  // {"title": "[ao] adding section to help users decide which quantization to use", 
  // "body": "Stack from [ghstack](https://github.com/ezyang/ghstack) (oldest at bottom):\n* __->__ #90748\n\nSummary: adding a section to the docs that help users understand when to\nuse the many quantization tools\n\nTest Plan: just docs\n\nReviewers:\n\nSubscribers:\n\nTasks:\n\nTags:",
  // "created_at": "2022-12-13T04:21:51Z"}, 
  // {"title": "temp", "body": "Stack from [ghstack](https://github.com/ezyang/ghstack) (oldest at bottom):\n* #90748\n* __->__ #90747\n\nSummary:\n\nTest Plan:\n\nReviewers:\n\nSubscribers:\n\nTasks:\n\nTags:", "created_at": "2022-12-13T04:21:46Z"}, 
  // {"title": "Revert \"[reland][dynamo] use optimizers correctly in benchmarking (#87492)\"", "body": "Stack from [ghstack](https://github.com/ezyang/ghstack) (oldest at bottom):\n* __->__ #90746\n\nThis reverts commit d91d7a322172da4d92672301f3cfa3344d544a9e.\n\ncc @mlazos @soumith @voznesenskym @yanboliang @penguinwu @anijain2305 @EikanWang @jgong5 @Guobing-Chen @chunyuan-w @XiaobingSuper @zhuhaozhe @blzheng @Xia-Weiwen @wenzhe-nrv @jiayisunx", "created_at": "2022-12-13T03:43:04Z"}, {"title": "Fix FSDP checkpoint tests", "body": "Stack from [ghstack](https://github.com/ezyang/ghstack) (oldest at bottom):\n* __->__ #90745\n* #90621\n* #90620\n* #90579\n* #90523\n\n", "created_at": "2022-12-13T03:18:44Z"}, {"title": "feature: adding the ability to restore shapes after loading a traced model", "body": "Adds the ability to store inputs used in tracing models when calling torch.jit.save and restore the input shapes using torch.jit.load if the appropriate variables are set.\r\n\r\nFixes [89185](https://github.com/pytorch/pytorch/issues/89185)\r\n", "created_at": "2022-12-13T02:31:34Z"}, {"title": "[inductor] Pattern match cat->view*->pointwise and hoist pointwise", "body": "Summary:\nInductor can't fuse pointwise into the output of concat, but it can\nfuse into the inputs, and that's the same thing.  So we hoist pointwise through\na concat (followed by an optional series of views).\n\nTest Plan: New unit test\n\nDifferential Revision: D41901656\n\n\n\ncc @mlazos @soumith @voznesenskym @yanboliang @penguinwu @anijain2305 @EikanWang @jgong5 @Guobing-Chen @chunyuan-w @XiaobingSuper @zhuhaozhe @blzheng @Xia-Weiwen @wenzhe-nrv @jiayisunx @peterbell10 @desertfire", "created_at": "2022-12-13T01:58:23Z"}, {"title": "Adopt full_backward_pre_hook in DDP", "body": "### \uD83D\uDE80 The feature, motivation and pitch\n\nSince https://github.com/pytorch/pytorch/pull/86700 has landed supporting the full backward pre hook, we should enable this with DDP for a true module level pre-backward hook and eliminate things such as _DDPSink.\n\n### Alternatives\n\n_No response_\n\n### Additional context\n\n_No response_\n\ncc @mrshenli @pritamdamania87 @zhaojuanmao @satgera @gqchen @aazzolini @osalpekar @jiayisuse @H-Huang @kwen2501 @awgu", "created_at": "2022-12-13T01:54:01Z"}];
  try{
    var result = {}
    const info = req.body
    for ( var i = 0; i <issues.length; i++){
      if(issues[i].title.toString().search(info.keyword) != -1){
        //console.log('find');
        var t = issues[i].created_at.substring(0, 10);
        //console.log(t)
        if(t >= info.begin && t <= info.end){
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

module.exports = {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
  DataRangeChoose,
  GetCommunityDevelopment,
  GetCertainIssue,
};
