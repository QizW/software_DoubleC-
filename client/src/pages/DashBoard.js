// 点击对应仓库的view按钮后所展示的页面
//pytorchID:63973b6579b0905501ff42a7
import { useEffect } from "react";
import { useAppContext } from "../context/appContext";
import Loading from "../components/Loading";
import { useParams } from "react-router-dom";
import { Box, Grid, Container, Typography } from "@mui/material";
import {
  CommitNumber,
  IssueNumber,
  StarNumber,
  ForkNumber,
  TimeLine,
  Language,
  Contribute,
  CommitFrequency,
  IssueFrequency,
  ContributorList,
} from "../components/DashBoard";
import DevelopingSpeed from "../components/DashBoard/DevelopingSpeed";
import AllCommits from "../components/DashBoard/AllCommits";
import IssueAnalyze from "../components/DashBoard/IssueAnalyze";
import CommitFrequencyData from "../components/DashBoard/CommitFrequencyData";
import IssueFrequencyData from "../components/DashBoard/IssueFrequencyData";

export default function DashboardApp() {
  useEffect(() => {
    getDashBoard(id);
  }, []);
  const { id } = useParams();
  const { isLoading, detail, getDashBoard } = useAppContext();
  const {
    forks,
    stars,
    open_issues,
    timeline,
    language,
    commit_frequency,
    issue_frequency,
    contributors,
  } = detail;

  console.log(detail)
  console.log(id)
  if (isLoading) {
    return <Loading center />;
  } else {
    const contribute = {
      name: [],
      contributions: [],
      followers: [],
    };

    if (contributors) {
      // 原本限制了最多显示5个贡献者
      for (var i = 0; i < Math.min(5, contributors.length); ++i) {
        contribute.name.push(contributors[i].name);
        contribute.contributions.push(contributors[i].contributions);
        contribute.followers.push(contributors[i].followers)
      }
    }

    return (
      <Container maxWidth="xl">
        <Box sx={{ pb: 5 }}>
          <Typography variant="h4">Report</Typography>
        </Box>
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <CommitNumber id={id}/>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <IssueNumber total={open_issues} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StarNumber total={stars} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ForkNumber total={forks} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TimeLine {...timeline} />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Language {...language} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <CommitFrequencyData id={id} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <IssueFrequencyData id={id} />
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <Contribute {...contribute} />
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <DevelopingSpeed id={id} />
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <AllCommits id={id}/>
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <IssueAnalyze id={id}/>
            </Grid>
            {contributors && (
              <Grid item xs={12} sm={6} md={12}>
                <ContributorList {...contributors} />
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    );
  }
}
