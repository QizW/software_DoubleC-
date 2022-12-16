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
  import FormRow from "../FormRow";
  import { useAppContext } from "../../context/appContext";
  import { Icon } from "@iconify/react";
  import { DatePicker, DateRangePicker } from "@mui/lab";
  import { LocalizationProvider } from "@mui/lab";
  import DevelopingSpeedChart from "./DevelopingSpeedChart";
  import CommitFrequency from "./CommitFrequency";
  import DesignAna from "./DesignAnalasis"
const authFetch = axios.create({
  baseURL: "http://localhost:4538/",
});

const DesignAnalasisDatas = (id) => {
    useEffect(() => {
        handleSubmit()
    }, []);

  const [beginTime,SetBeginTime] = useState("");
  const [endTime,SetEndTime] = useState("");
  const [developingSpeed,SetDevelopingSpeed] = useState([]);

  const handleBeginTime = (e) => {
      SetBeginTime(e.target.value);
  }

  const handleEndTime = (e) => {
      SetEndTime(e.target.value);
  }

  const handleSubmit = async () => {
      const ID = id.id;
      try{
        console.log({"id":ID , "begin":beginTime, "end":endTime})
          var tmp  = await authFetch.post("/DesignAnalysis",{"id":ID , "begin":beginTime, "end":endTime});
          const data = tmp.data;
          var res=[]
          for (var i in data){
            const tmpJson = data[i]
            for(var j in tmpJson){
                res.push({day:j,value:tmpJson[j],category:i})
            }
          }
          console.log(res)
          SetDevelopingSpeed(res);
      }
      catch(error){
          alert(error)
      }
    }
  
  return (
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
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        aria-label="search"
                        onClick={handleSubmit}
                        >
                        <Icon icon="eva:search-outline" color="#2cb1bc" />
                    </IconButton>
                  </Toolbar>
                </AppBar>
                <DesignAna data={developingSpeed}/>
              </Box>
    
  );
};

export default DesignAnalasisDatas;
