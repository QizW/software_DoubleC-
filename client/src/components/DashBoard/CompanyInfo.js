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
  import Alert from "../Alert";
  import FormRow from "../../components/FormRow";
  import { useAppContext } from "../../context/appContext";
  import { Icon } from "@iconify/react";
  import { DatePicker, DateRangePicker } from "@mui/lab";
  import { LocalizationProvider } from "@mui/lab";
import CompanyInfoChart from "./CompanyInfoChart";
  const { RangePicker } = DatePicker;
    const authFetch = axios.create({
        baseURL: "http://localhost:4538/",
    });
const CompanyInfo = (id) => {
  useEffect(() => {
    handleSubmit()
}, []);
    const [beginTime,SetBeginTime] = useState("");
    const [endTime,SetEndTime] = useState("");
    const [allCommits,SetAllCommits] = useState({});

    const handleBeginTime = (e) => {
        SetBeginTime(e.target.value);
    }

    const handleEndTime = (e) => {
        SetEndTime(e.target.value);
    }

    const handleSubmit = async () => {
        const ID = id.id;
        try{
            var tmp = await authFetch.post("/CompanyInfo",{"id":ID })
            console.log(tmp)
            SetAllCommits(tmp.data)
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
                    <IconButton
                        aria-label="search"
                        onClick={handleSubmit}
                        >
                        <Icon icon="eva:search-outline" color="#2cb1bc" />
                    </IconButton>
                    点击生成公司信息图
                  </Toolbar>
                </AppBar>
                  <CompanyInfoChart data = {allCommits}/>
              </Box>
              </>
              
            )
};

export default CompanyInfo;
