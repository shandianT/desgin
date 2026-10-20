import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import PublicShare from './PublicShare.jsx';
function PublicRoute(){
  const [hash,setHash]=useState(location.hash);
  useEffect(()=>{const change=()=>setHash(location.hash);addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  return <PublicShare key={hash}/>;
}
createRoot(document.getElementById('knowledge-public-root')).render(<PublicRoute/>);
