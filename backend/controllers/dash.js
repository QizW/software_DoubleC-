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
    const repoMessage = await octokit.request("GET /repos/{owner}/{repo} -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"", {
      owner: req.body.owner,
      repo: req.body.repoName,
    });
    // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\nRepo Message:",repoMessage.data,"\n!!!!!!!!!!!!!!!!!!!!!!");
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
    "GET /repos/{owner}/{repo}/commits  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );
  //获取commits数，看起来这个接口一下只能获取一页的数据，用循环的方式去查看有没有下一页
  if (repoMessage.data.length === 0) return { 2022: "0", 2021: "0", 2020: "0" };
  for (var i = 2; i <= 5; i++) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/commits  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: i,
      }
    );
    if (NextRepoMessage.data.length === 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
  }
//获取最早和最晚的提交时间
  const x1 = repoMessage.data[0].commit.committer.date;
  const x2 =
    repoMessage.data[repoMessage.data.length - 1].commit.committer.date;
  const t1 = TransDate(x1);
  const t2 = TransDate(x2);
  var frequency = {};
//Transdate看起来是转换成年月了
  if (t1 - t2 < 2) {
    frequency = CountDayCommit(repoMessage);
  } else if (t1 - t2 > 15) {
    //floor向下取整
    year1 = Math.floor(t1 / 12);
    year2 = Math.floor(t2 / 12);
    frequency = CountYearCommit(year1, year2, repoMessage.data);
  } else {
    frequency = CountMonthCommit(t1, t2, repoMessage.data);
  }
  return frequency;
};

//统计日提交
const CountDayCommit = (Msg) => {
  var order = {};
  var result = {};

  for (var i in Msg.data) {
    var t = Msg.data[i].commit.committer.date.substring(0, 10);
    //又是库
    formalLength = Object.keys(order).length;
    //统计时间
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
    } else {
      result[t] += 1;
    }
  }
  var pra = Math.floor((Object.keys(order).length - 1) / 6) + 1;
  var answer = {};
  var a = Math.floor(Object.keys(order).length / pra);
  if (pra === 1) {
    for (var i = 0; i < a; i++) {
      answer[order[i.toString()]] = result[order[i.toString()]];
    }
    return answer;
  }
  for (var i = 0; i < a; i++) {
    pp = order[i * pra];
    var sum = 0;
    for (var j = i * pra; j <= i * pra + pra - 1; j++) {
      sum += result[order[j.toString()]];
    }
    answer[pp] = sum;
  }
  return answer;
};

//获取Issue频率
const RepoGetIssueFrequency = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/issues  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );
    //和前面同理
  if (repoMessage.data.length === 0) return { 2022: "0", 2021: "0", 2020: "0" };
  for (var i = 2; i <= 5; i++) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/issues  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: i,
      }
    );
    if (NextRepoMessage.data.length === 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
  }

  const x1 = repoMessage.data[0].created_at;
  const x2 = repoMessage.data[repoMessage.data.length - 1].created_at;
  const t1 = TransDate(x1);
  const t2 = TransDate(x2);

  var frequency = {};
  if (t1 - t2 < 2) {
    frequency = CountDayIssue(repoMessage);
  } else if (t1 - t2 > 15) {
    year1 = Math.floor(t1 / 12);
    year2 = Math.floor(t2 / 12);
    frequency = CountYearIssue(year1, year2, repoMessage.data);
  } else {
    frequency = CountMonthIssue(t1, t2, repoMessage.data);
  }
  return frequency;
};
//和前面同理
const CountDayIssue = (Msg) => {
  var order = {};
  var result = {};

  for (var i in Msg.data) {
    var t = Msg.data[i].created_at.substring(0, 10);
    formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
    } else {
      result[t] += 1;
    }
  }
  var pra = Math.floor((Object.keys(order).length - 1) / 6) + 1;
  var answer = {};
  var a = Math.floor(Object.keys(order).length / pra);
  if (pra === 1) {
    for (var i = 0; i < a; i++) {
      answer[order[i.toString()]] = result[order[i.toString()]];
    }
    return answer;
  }
  for (var i = 0; i < a; i++) {
    pp = order[i * pra];
    var sum = 0;
    for (var j = i * pra; j <= i * pra + pra - 1; j++) {
      sum += result[order[j.toString()]];
    }
    answer[pp] = sum;
  }
  return answer;
};

const TransDate = (date) => {
  year = date.substring(0, 4);
  month = date.substring(5, 7);
  year1 = parseInt(year, 10);
  month1 = parseInt(month, 10);
  return (year1 - 2000) * 12 + month1 - 1;
};
//统计年份
const CountYearCommit = (year1, year2, commitmsg) => {
  var countNum = new Array(year1 - year2 + 1).fill(0);
  commitmsg.map((x) => {
    year0 = Math.floor(TransDate(x.commit.committer.date) / 12);
    countNum[year1 - year0] += 1;
  });

  var obj = {};
  for (var i = year1; i >= year2; i--) {
    nn = i + 2000;
    cc = nn + "";
    obj[cc] = countNum[year1 - i];
  }
  return obj;
};
//同上
const CountYearIssue = (year1, year2, commitmsg) => {
  var countNum = new Array(year1 - year2 + 1).fill(0);
  commitmsg.map((x) => {
    year0 = Math.floor(TransDate(x.created_at) / 12);
    countNum[year1 - year0] += 1;
  });
  var obj = {};
  for (var i = year1; i >= year2; i--) {
    nn = i + 2000;
    cc = nn + "";
    obj[cc] = countNum[year1 - i];
  }
  return obj;
};

const CountMonthCommit = (t1, t2, commitmsg) => {
  var countNum = new Array(t1 - t2 + 1).fill(0);
  commitmsg.map((x) => {
    t = TransDate(x.commit.committer.date);
    countNum[t1 - t] += 1;
  });

  var obj = {};
  for (var i = t1; i >= t2; i--) {
    mm = (i % 12) + 1;
    nn = (i - mm + 1) / 12 + 2000;
    cc = mm > 9 ? nn + "-" + mm : nn + "-0" + mm;
    obj[cc] = countNum[t1 - i];
  }
  return obj;
};

const CountMonthIssue = (t1, t2, commitmsg) => {
  var countNum = new Array(t1 - t2 + 1).fill(0);
  commitmsg.map((x) => {
    t = TransDate(x.created_at);
    countNum[t1 - t] += 1;
  });

  var obj = {};
  for (var i = t1; i >= t2; i--) {
    mm = (i % 12) + 1;
    nn = (i - mm + 1) / 12 + 2000;
    cc = mm > 9 ? nn + "-" + mm : nn + "-0" + mm;
    obj[cc] = countNum[t1 - i];
  }
  return obj;
};

const RepoGetContributors = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/contributors  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
    {
      owner: owner,
      repo: name,
    }
  );
  console.log("??????????????????????\n"+repoMessage.data+"\n????????????????????????????\n")
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
      "GET /repos/{owner}/{repo}/contributors -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
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
        "GET /repos/{owner}/{repo}/contributors -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
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
  console.log("count",count)
  const issueMessage = await octokit.request(
      "GET /repos/{owner}/{repo}  -H \"If-Modified-Since: Mon, 12 Dec 2022 15:00:00 GMT\"",
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


module.exports = {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
};
