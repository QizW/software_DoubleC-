//存放后端路由

const express = require("express");
const router = express.Router();

//存放调用方法，缺少对于前端传过来的数据的审核
const {
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
  GetCommitDevelopment,
  CompanyInfo,
  DesignAnalysis,
  GetIssueDevelopment,
} = require("../controllers/dash");
const { CheckUser, CreateUser,Getuserinfo} = require("../controllers/user");

router.route("/import").post(GetMessage);
router.route("/login").post(CheckUser);
router.route("/register").post(CreateUser);
router.route("/search").post(SearchRepoName);
router.route("/dashboard").post(GetDashboard);
router.route("/delete").post(DeleteRepo);
router.route("/DataRangeChoose").post(DataRangeChoose)
router.route("/SigCompare").post(SigCompare)
router.route("/ComCompare").post(ComCompare)
router.route("/GetCommunityDevelopment").post(GetCommunityDevelopment)
router.route("/GetCertainIssue").post(GetCertainIssue)
router.route("/GetAllCommits").post(GetAllCommits)
router.route("/GetAllIssues").post(GetAllIssues)
router.route("/GetCertainCommitter").post(GetCertainCommitter)
router.route("/DesignAnalysis").post(DesignAnalysis)
router.route("/CompanyInfo").post(CompanyInfo)
router.route("/GetCommitDevelopment").post(GetCommitDevelopment)
router.route("/GetIssueDevelopment").post(GetIssueDevelopment)
//获取用户信息
router.route("/getuser").post(Getuserinfo);

module.exports = router;
