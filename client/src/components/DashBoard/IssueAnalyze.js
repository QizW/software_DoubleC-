import { merge } from "lodash";
import moment from "moment";
import ReactApexChart from "react-apexcharts";
import { Card, CardHeader, Box } from "@mui/material";
import axios from "axios";
import BaseOptionChart from "./BaseOptionChart";
import Loading from "../Loading";
import AllCommitsChart from "./AllCommitsChart";
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
  import { useState, useEffect } from "react";
  import { Icon } from "@iconify/react";
  import { DatePicker, DateRangePicker } from "@mui/lab";
  import IssueAnalyzeChart from "./IssueAnalyzeChart";
    const authFetch = axios.create({
        baseURL: "http://localhost:4538/",
    });
    

const IssueAnalyze = (id) => {
    const [beginTime,SetBeginTime] = useState("");
    const [endTime,SetEndTime] = useState("");
    const [keyword,SetKeyword] = useState("");
    const [issueInfo,SetIssueInfo] = useState("");

    const handleBeginTime = (e) => {
        SetBeginTime(e.target.value);
    }

    const handleEndTime = (e) => {
        SetEndTime(e.target.value);
    }

    const handleKeyword = (e) => {
        SetKeyword(e.target.value);
    }

    const handleSubmit = async () => {
        const ID = id.id;
        try{
            var tmp = await authFetch.post("/GetCertainIssue",{"id":ID , "begin":beginTime, "end":endTime,"keyword":issueInfo});
            SetIssueInfo(tmp.data)
        }
        catch(error){
            alert(error)
        }  
    }
        return (
            <>
              <Box sx={{ flexGrow: 1, mt: 2 }}>
                <AppBar
                  position="static"
                  color=""
                  sx={{
                    borderRadius: 2,
                    height: 90,
                  }}
                >
                  <Toolbar sx={{ mt: 1 }}>
                    <FormControl sx={{ m: 1, width: "20ch" }} variant="outlined">
                      <InputLabel>Begin Time</InputLabel>
                      <OutlinedInput
                        id="search-repos"
                        type="text"
                        value={beginTime}
                        onChange={handleBeginTime}
                        label="SearchRepos"
                      />
                    </FormControl>
                    <FormControl sx={{ m: 1, width: "20ch" }} variant="outlined">
                      <InputLabel>End Time</InputLabel>
                      <OutlinedInput
                        id="search-repos"
                        type="text"
                        value={endTime}
                        onChange={handleEndTime}
                        label="SearchRepos"
                      />
                    </FormControl>
                    <FormControl sx={{ m: 1, width: "20ch" }} variant="outlined">
                      <InputLabel>keyword</InputLabel>
                      <OutlinedInput
                        id="search-repos"
                        type="text"
                        value={keyword}
                        onChange={handleKeyword}
                        label="SearchRepos"
                      />
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        aria-label="search"
                        onClick={handleSubmit}
                        >
                        <Icon icon="eva:search-outline" color="#2cb1bc" />
                    </IconButton>
                    输入格式：2020-01-01
                  </Toolbar>
                </AppBar>
                  <IssueAnalyzeChart data = {issueInfo}/>
              </Box>
              </>
            )
};

export default IssueAnalyze;