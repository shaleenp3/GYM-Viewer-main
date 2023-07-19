import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import bgVideo from '../assets/bg-video.mp4';
import '../css/workoutLog.css'
import { MDBBadge, MDBBtn, MDBTable, MDBTableHead, MDBTableBody } from 'mdb-react-ui-kit';

const WorkoutLog = () => {
  const userName = localStorage.getItem('userName')
  const [filteredLogs, setFilteredLogs] = useState([])
  const [userLogs, setUserLogs] = useState([]);
  const [selectedLogType, setSelectedLogType] = useState('Basic Timer')

  function changeLogType(type = 'Basic Timer') {
    setSelectedLogType(type)
    setFilteredLogs(userLogs.filter(data => data.workoutName == type))
    // setFilteredLogs(filteredLogs.sort((a, b) => a.created - b.created))
  }

  // let response = null
  useEffect(() => {
    if (userName) {
      getLogs()
    }
  }, [userName]);
  async function getLogs() {
    try {
      const res = await axios.get(
        `http://localhost:8080/workout/${userName}`
      );
      setUserLogs(res.data);
      let initialData = res.data
      // console.log();
      initialData = initialData.filter(data => data.workoutName == selectedLogType)
      setFilteredLogs(initialData)
    } catch (error) {
      console.log(error);
    }
  }
  async function deleteLog(id) {
    const res = await axios.delete(`http://localhost:8080/workout/${id}`)
    alert('Logs Deleted Successfully ')
    await getLogs();
    console.log('deleted', res);
  }
  return (
    <div className="worklog-container">
      <div className="table-title">{selectedLogType}</div>
      <div className="content">
        <div className="sidebar">
          <div className="basicTimer">
            <button onClick={() => { changeLogType('Basic Timer') }}>
              BASIC
            </button>
          </div>
          <div className="armapTimer">
            <button onClick={() => { changeLogType('ARMAP Timer') }}>
              ARMAP
            </button>
          </div>
          <div className="emomTimer">
            <button onClick={() => { changeLogType('EMOM Timer') }}>
              EMOM
            </button>
          </div>
          <div className="tabataTimer">
            <button onClick={() => { changeLogType('TABATA Timer') }}>
              TABATA
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="table table-striped table-bordered" align='bottom'>
            <thead className="table-dark">
              <tr>
                <th scope='col'>WorkOut Date</th>
                <th scope='col'>Duration</th>
                <th scope='col'>Number of Rounds</th>
                <th scope='col'>Action</th>
              </tr>
            </thead>
            <tbody className="table-secondary">
              {filteredLogs.map((data) => (
                <tr key={data._id}>
                  <td>{data.created}</td>
                  {/* <td>{data.created.split('T')[0]}</td> */}
                  <td>{data.duration}</td>
                  <td>{data.numberOfRounds}</td>
                  <td style={{color:'red'}}><i className="fa fa-times-circle" aria-hidden="true" onClick={() => deleteLog(data._id)}></i></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <video autoPlay muted loop id="myVideo">
        <source src={bgVideo} type="video/mp4" />
      </video>
    </div>
  )

};
export default WorkoutLog;
