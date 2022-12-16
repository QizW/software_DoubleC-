// 点击对应仓库的view按钮后所展示的页面
//pytorchID:63973b6579b0905501ff42a7
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
import axios from "axios";
import {
  AppBar,
  Stack,
  Toolbar,
  Button,
  IconButton,
  OutlinedInput,
  InputLabel,
  InputAdornment,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import CompanyInfo from "../components/DashBoard/CompanyInfo";

const authFetch = axios.create({
  baseURL: "http://localhost:4538/",
});

export default function PytorchAnalysis() {

  const [detail,setDetail] = useState({});
  const handleSubmit = async () => {
    try{
      console.log({id:"63981728399f1e9bbd21d89b"})
      var tmp = await authFetch.post("/dashboard",{id:"63981728399f1e9bbd21d89b"});
      setDetail(tmp.data.detail)
      console.log(detail)
    }
    catch(error){
        alert(error)
    }  
  }

  return (
    <Box>
      <Toolbar sx={{ mt: 1 }}>
      </Toolbar>
        <Grid item xs={12} sm={6} md={12}>
          <AllCommits id={"63981728399f1e9bbd21d89b"}/>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <IssueAnalyze id={"63981728399f1e9bbd21d89b"}/>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <CompanyInfo id={"63981728399f1e9bbd21d89b"}/>
        </Grid>
    </Box>
  );
}
