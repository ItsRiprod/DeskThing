import './Audible.css';
import React, { useState, useEffect } from 'react';
import socket from '../../helpers/WebSocketService';

const Audible: React.FC = () => {
  const [library, setLibrary] = useState([]);
  const [libraryImages, setLibraryImages] = useState({});

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'audible_library_images') {
        handleLibraryImages(msg.data);
      }
      if (msg.type === 'audible_library') {
        handleLibrary(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSend = (type: string, request: string, url: string, params: any ) => {
    
    if (socket.is_ready()) {
      const data = {
        app: 'Audible',
        type: type,
        request: request,
        url: url,
        params: params,
      };
      socket.post(data);
    }
  };

  const handleLibrary = (data: any) => {
    console.log(data);
    setLibrary(data || []);
  };

  const handleLibraryImages = (data: any) => {
    const images = {};
    data.forEach((item: any) => {
      images[item.asin] = item.imageData;
    });
    console.log(images);
    setLibraryImages(images);
  };

  return (
    <div className="view_audible">
      {library.length > 0 ? (
        <div className="library-container">
          {library.map((item) => (
            <div key={item.asin} className="library-item">
              <div
                className="library-item-background"
                style={{ backgroundImage: `url(${libraryImages[item.asin]})` }}
              />
              <div className="library-item-content">
                <h3>{item.title}</h3>
                <p>Progress: {item.progress_percent}%</p>
                <p>Total Length: {item.total_length_min} min</p>
                <p>Length Left: {item.length_left_sec} sec</p>
                <p>ASIN: {item.asin}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>

          <button onClick={() => handleSend('get', 'util', '/1.0/library', {
            'response_groups': 'listening_status, media'
          })}>Send Get</button>
          <button onClick={() => handleSend('get', 'util', '/1.0/annotations/lastpositions', {
            'asins': 'B07XJQQRQ6,B07XJQQRQ6,ASCDSD',
          })}>Send Get</button>
          <button onClick={() => handleSend('get', 'library', '', {})}>Get Library</button>
          <button onClick={() => handleSend('put', 'util', '/1.0/stats/events', {})}>Send Put</button>
          <button onClick={() => handleSend('post', 'util', '/1.0/library/collections', { 'collection_type': '' })}>Send Post</button>
        </div>
      )

      }


    </div>
  );
};

export default Audible;
