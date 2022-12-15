import axios from 'axios'
import SigComC from '../components/DashBoard/SigComChart'
import SigColumn from "../components/DashBoard/SigColumn";
import ComColumn from '../components/DashBoard/ComColumn';
import ComComC from '../components/DashBoard/ComComCharts';
import { useAppContext } from "../context/appContext";
import { AppBar,Box, Grid, Container, Typography } from "@mui/material";
import React, { useEffect, useState, useReducer } from 'react';
import { Radio, Switch, Select, DatePicker, Button} from 'antd';
import ReactDOM from 'react-dom';
import { keys } from 'lodash';

const { RangePicker } = DatePicker;
const authFetch = axios.create({
  baseURL: "http://localhost:4538/",
});

var reponame = []
var Siginfo = [];
var Siginfo1 = [];
var Cominfo = [];
var Cominfo1 = [];
const Compare = () => {
    var {repos} = useAppContext();
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
  const [Crepo, setCrepo] = useState([])
  const [any, forceUpdate] = useReducer(num => num + 1, 0);

  const [timelist, Settimelist] = useState([])


  const Sigreq = async e =>{
    SetBeginlist(e.map(item=>{
      return item.slice(0,10)
    }))
    SetEndlist(e.map(item=>{
      return item.slice(12)
    }))
  }

  const Comreq = e =>{
    setCrepo([...e])
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
      console.log(id,Sigkind,Belist,Enlist,sort)
      const res = await authFetch.post('/SigCompare', {"id": id, "kind": Sigkind, "begin" : Belist, "end" : Enlist, "sort": sort})
      var info = res.data
      if(Sigkind !== 'contributors')
      {
          Setdatas(info)
      }
      else
      {
        Setdatas1(info)
      }
      forceUpdate()
    }
    catch(err)
    {
        alert(err)
    }
  }

  function Setdatas1(info) {
    var answer = []
    for(var i=0; i<info.length; i++)
    {
      var dir1 = {}
      var dir2 = {}
      var dir3 = {}
      var dir4 = {}
      dir1.name = info[i].name
      dir1.type = "contributions"
      dir1.value = info[i].contributions
      dir2.name = info[i].name
      dir2.type = "followers"
      dir2.value = info[i].followers
      dir3.name = info[i].name
      dir3.type = "public_gists"
      dir3.value = info[i].public_gists
      dir4.name = info[i].name
      dir4.type = "public_repos"
      dir4.value = info[i].public_repos
      answer.push(dir1)
      answer.push(dir2)
      answer.push(dir3)
      answer.push(dir4)
    }
    Siginfo1 = answer
  }

  function Setdatas(info) {
    var infolist = info
    var answer = []
    console.log(infolist)
    for(var i=0; i<infolist.length; i++)
    {
        var keys = Object.keys(infolist[i]).sort();
        if(sort === 1)
            keys = keys.reverse()
        for(var j = 0; j<keys.length; j++)
        {
            var dir = {}
            if(sort === 1)
            {
              var name = keys[keys.length-1] + '——' + keys[0]
              dir.day = (-GetDateDiff(keys[0], keys[j], "day"))+1
            }
            else
            {
              var name = keys[0] + '——' + keys[keys.length-1]
              dir.day = GetDateDiff(keys[0], keys[j], "day")+1
            }
            dir.name = name
            dir.number = infolist[i][keys[j]].toString()
            answer.push(dir)
        }
    }
    // if(answer.length > 0)
    //   answer.push({"name":answer[0].name, "day" : 0, "number": 0})
    answer = NameAnalysis(answer)
    Siginfo = [{"name":answer[0].name, "day" : 0, "number": 0},...answer.sort(function(a,b){return parseInt(a.day)-parseInt(b.day)})]
    console.log(answer)
}

function GetDateDiff(startTime, endTime, diffType) {
  //将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式 
  startTime = startTime.replace(/\-/g, "/");
  endTime = endTime.replace(/\-/g, "/");
  //将计算间隔类性字符转换为小写
  diffType = diffType.toLowerCase();
  var sTime =new Date(startTime); //开始时间
  var eTime =new Date(endTime); //结束时间
  //作为除数的数字
  var timeType =1;
  switch (diffType) {
      case"second":
          timeType =1000;
      break;
      case"minute":
          timeType =1000*60;
      break;
      case"hour":
          timeType =1000*3600;
      break;
      case"day":
          timeType =1000*3600*24;
      break;
      default:
      break;
  }
  return parseInt((eTime.getTime() - sTime.getTime()) / parseInt(timeType));
}



  const repo = repos
  const Choosecom = (e) => {
    setValue(e.target.value);
  };
  const ChangeSort = (e) => {
    setSort(e ? 0 : 1);
  };
  const GetSigRepo = (e) =>{
    setSig(e)
  }
  const GetKind = (e) =>{
    setSigKind(e)
    Siginfo = []
  }
  const Sigtimechange = (e)=>{
    SetSigbe((e[0].$y).toString()+'-'+(e[0].$M < 9 ? '0' : '')+(e[0].$M+1).toString()+ '-' + (e[0].$D<10 ? '0' : '')+(e[0].$D).toString())
    SetSigEn((e[1].$y).toString()+'-'+(e[1].$M < 9 ? '0' : '')+(e[1].$M+1).toString()+ '-' + (e[1].$D<10 ? '0' : '')+(e[1].$D).toString())
  }
  const Comtimechange = (e) =>{
    SetCombe((e[0].$y).toString()+'-'+(e[0].$M < 9 ? '0' : '')+(e[0].$M+1).toString()+ '-' + (e[0].$D<10 ? '0' : '')+(e[0].$D).toString())
    SetComEn((e[1].$y).toString()+'-'+(e[1].$M < 9 ? '0' : '')+(e[1].$M+1).toString()+ '-' + (e[1].$D<10 ? '0' : '')+(e[1].$D).toString())
  }
  const AddTimeList = ()=> {
    var note = 0
    for(var i = 0; i<timelist.length; i++)
    {
      var begins = timelist[i].value.slice(0,10)
      var ends = timelist[i].value.slice(12)
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
    Cominfo = []
  }

  const ComSubmit = async() =>{
    var id = []
    for(var i=0; i<Crepo.length; i++)
    {
      for(var j=0; j<repos.length; j++)
      {
        if(repos[j].name === Crepo[i])
        {
          id.push(repos[j]._id)
          break
        }
      }
    }
    try{
      console.log(id,ComKind,CBe,CEn,sort)
      const res = await authFetch.post('/ComCompare', {"id": id, "kind": ComKind, "begin" : CBe, "end" : CEn, "sort": sort})
      var info = res.data
      // console.log(res,"!!")
      if(ComKind !== 'others')
      {
          console.log(info)
          setCominfos(info)
      }
      else
      {
        setCominfo(info)
      }
      forceUpdate()
    }
    catch(err)
    {
        alert(err)
    }
  }

  const setCominfos = (info)=>{
    var answer = []
    var infolist = info
    for(var i=0; i<infolist.length; i++)
    {
      var keys = Object.keys(infolist[i]).sort()
      if(sort === 1)  keys = keys.reverse()
      for(var j=0; j<keys.length; j++)
      {
        var dir = {}
        dir.name = Crepo[i]
        if(sort === 1)
          dir.day = -GetDateDiff(keys[j], keys[0], "day")
        else
          dir.day = GetDateDiff(keys[0], keys[j], "day")
        dir.number = infolist[i][keys[j]].toString()
        answer.push(dir)
      }
    }
    answer = NameAnalysis(answer)
    Cominfo = [{"name":answer[0].name, "day" : 0, "number": 0},...answer.sort(function(a,b){return parseInt(a.day)-parseInt(b.day)})]
    console.log(Cominfo)
  }

  const setCominfo = (info)=>{
    var answer = []
    for(var i=0; i<info.length; i++)
    {
      var dir1 = {}
      var dir2 = {}
      var dir3 = {}
      var dir4 = {}
      var dir5 = {}
      dir1.name = info[i].name
      dir1.type = "community_contributor"
      dir1.value = info[i].community_contributor
      dir2.name = info[i].name
      dir2.type = "community_issuer"
      dir2.value = info[i].community_issuer
      dir3.name = info[i].name
      dir3.type = "forks"
      dir3.value = info[i].forks
      dir4.name = info[i].name
      dir4.type = "open_issues"
      dir4.value = info[i].open_issues
      dir5.name = info[i].name
      dir5.type = "stars"
      dir5.value = info[i].stars
      answer.push(dir1)
      answer.push(dir2)
      answer.push(dir3)
      answer.push(dir4)
      answer.push(dir5)
    }
    Cominfo1 = answer
  }
  useEffect(()=>{
    reponame = []
    for(var i=0; i<repos.length; i++)
      reponame.push(repo[i].name)
  },[Siginfo]);

  const NameAnalysis = (name)=>{
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
    var lists = new_name
    return  lists
  }

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
          value={Sigrepo}
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
        <br></br>
        <span> </span>
        <br></br>
        {Sigkind !== 'contributors' ?
          <SigComC data1={Siginfo} id='container'/>
          :
          <SigColumn data1={Siginfo1}/>
        }
        </Box>
      :
      <Box sx={{ flexGrow: 1, mt: 3 }}>
        <Select
          mode="tags"
          style={{ width: '40%' }}
          placeholder="选择比较的仓库"
          onChange={Comreq}
          // defaultValue=''
          value={Crepo}
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
        {ComKind !== 'others' ?
          <SigComC data1={Cominfo}/>
          :
          <ComColumn data1={Cominfo1}/>
        }
      </Box>
    }
      </Container>
  );
};

export default Compare