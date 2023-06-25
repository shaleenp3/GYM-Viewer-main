import React from "react";
import bgVideo from '../assets/bg-video.mp4';
//import '../css/workoutLog.css'


const WorkoutLog = () => {
  
  return (
    
      <video autoPlay muted loop id="myVideo">
        <source src={bgVideo} type="video/mp4" />
      </video>
    
  )

};
export default WorkoutLog;
