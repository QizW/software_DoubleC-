import { Link } from "react-router-dom";
import axios from 'axios'
import { useAppContext } from "../context/appContext";
import { AppBar,Box, Grid, Container, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { Radio, Switch, Select, DatePicker, Button} from 'antd';
const { RangePicker } = DatePicker;
const authFetch = axios.create({
  baseURL: "http://localhost:4538/",
});

var reponame = []

const Compare = () => {
    var {
      user,
      getRepos,
      repos,
      viewMyRepos,
      isLoading,
      search,
      page,
      numOfPages,
      showAlert,
    } = useAppContext();
  const [value, setValue] = useState(1);
  const [sort, setSort] = useState(0)
  const [Sigrepo, setSig] = useState('pytorch')
  const [Sigkind, setSigKind] = useState('commit_frequency')
  const [ComKind, setComKind] = useState('commit_frequency')
  const [Belist, SetBeginlist] = useState([])
  const [Enlist, SetEndlist] = useState([])
  const [SBe, SetSigbe] = useState("")
  const [SEn, SetSigEn] = useState("")
  const [CBe, SetCombe] = useState("")
  const [CEn, SetComEn] = useState("")
  const [timelist, Settimelist] = useState([])
  const Sigreq = async e =>{
    SetBeginlist(e.map(item=>{
      return item.slice(0,9)
    }))
    SetEndlist(e.map(item=>{
      return item.slice(11)
    }))
  }

  const SigSubmit = async() =>{
    var id = ''
    for(var i=0; i<repos.length; i++)
    {
      if(repos[i].name === Sigrepo)
      {
        id = repos[i]._id
        break
      }
    }
    try{
      const res = await authFetch.post('/SigCompare', {"id": id, "kind": Sigkind, "begin" : Belist, "end" : Enlist, "sort": sort})
      const info = res.data
      console.log(info, info[0])
    }
    catch(err)
    {
        alert(err)
    }
  }

  const repo = repos
  const Choosecom = (e) => {
    setValue(e.target.value);
  };
  const ChangeSort = (e) => {
    setSort(e ? 1 : 0);
  };
  const GetSigRepo = (e) =>{
    setSig(e)
  }
  const GetKind = (e) =>{
    setSigKind(e)
  }
  const Sigtimechange = (e)=>{
    SetSigbe((e[0].$y).toString()+'-'+(e[0].$M+1).toString()+ '-' + (e[0].$D).toString())
    SetSigEn((e[1].$y).toString()+'-'+(e[1].$M+1).toString()+ '-' + (e[1].$D).toString())
  }
  const Comtimechange = (e) =>{
    SetCombe((e[0].$y).toString()+'-'+(e[0].$M+1).toString()+ '-' + (e[0].$D).toString())
    SetComEn((e[1].$y).toString()+'-'+(e[1].$M+1).toString()+ '-' + (e[1].$D).toString())
  }
  const AddTimeList = ()=> {
    var note = 0
    for(var i = 0; i<timelist.length; i++)
    {
      var begins = timelist[i].value.slice(0,9)
      var ends = timelist[i].value.slice(11)
      if(SBe === begins && SEn === ends)
      {
        note = 1
        break
      }
    }
    if(note === 0)
    {
      Settimelist([...timelist, {label : SBe+'——'+SEn, value: SBe+'——'+SEn}])
    }
  }

  const GetComKind = e =>{
    setComKind(e)
  }

  const ComSubmit = async =>{

  }
  useEffect(()=>{
    reponame = []
    for(var i=0; i<repos.length; i++)
      reponame.push(repo[i].name)
    // console.log(repos)
  },[]);
  return (
    <Container maxWidth="xl">
      <Box sx={{ flexGrow: 1, mt: -2 }}>
        <AppBar
          position="static"
          color=""
          sx={{
            borderRadius: 2,
            height: 30,
          }}
        >
        <Container>
        <Radio.Group onChange={Choosecom} value={value}>
        <Radio value={1}>Sigle Compare</Radio>
        <Radio value={2}>Complex Compare</Radio>
        </Radio.Group>
        </Container>
        </AppBar>
        </Box>
      {value === 1 ?
      <Box sx={{ flexGrow: 1, mt: 3 }}>
        <Select
          defaultValue='pytorch'
          style={{
            width: 120,
          }}
          options={
            repo.map(item=>{
            var invalue = item.name
            return ({value: invalue, label: invalue});
          })}
          onChange={GetSigRepo}
        />
        <span> </span>
        <Select
          defaultValue='commit_frequency'
          style={{
            width: 160,
          }}
          options={[
            {value: 'commit_frequency', label: 'commit_frequency'},
            {value: 'issue_frequency', label: 'issue_frequency'},
            {value: 'contributors', label: 'contributors'}
          ]
          }
          onChange={GetKind}
        />
        <span> </span>
        {Sigkind !== 'contributors' ?
        <RangePicker onChange = {Sigtimechange} />
        : <></>
        }
        <span> </span>
        {Sigkind !== 'contributors' ?
        <Button type="dashed" onClick={AddTimeList}>添加到时间序列中</Button>
        : <></>
        }
        <span> </span>
        <Switch checkedChildren="正序" unCheckedChildren="倒序" defaultChecked onChange={ChangeSort}  />
        <span> </span>
        <Button onClick={SigSubmit}>生成表格</Button>
        <br></br>
        {Sigkind !== 'contributors' ?
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="选定的时间序列"
          onChange={Sigreq}
          options={timelist}
        />
        : <></>
        }
        </Box>
      :
      <Box sx={{ flexGrow: 1, mt: 3 }}>
        <Select
          mode="tags"
          style={{ width: '40%' }}
          placeholder="选择比较的仓库"
          onChange={Sigreq}
          options={
            repo.map(item=>{
            var invalue = item.name
            return ({value: invalue, label: invalue});
          })}
        />
        <span> </span>
        <Select
          defaultValue='commit_frequency'
          style={{
            width: 160,
          }}
          options={[
            {value: 'commit_frequency', label: 'commit_frequency'},
            {value: 'issue_frequency', label: 'issue_frequency'},
            {value: 'others', label: 'others'}
          ]
          }
          onChange={GetComKind}
        />
        <span> </span>
        {ComKind !== 'others' ?
        <RangePicker onChange = {Comtimechange} />
        : <></>
        }
        <span></span>
        <Switch checkedChildren="正序" unCheckedChildren="倒序" defaultChecked onChange={ChangeSort}  />
        <span> </span>
        <Button onClick={ComSubmit}>生成表格</Button>
        <br></br>
        
      </Box>
    }
      </Container>
  );
};

export default Compare