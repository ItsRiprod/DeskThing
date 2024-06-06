import React from 'react';

interface ListsProps {
  handleSendGet: (command: string, id: string) => void;
  data: any;
}

const Lists: React.FC<ListsProps> = ({ handleSendGet, data }) => {
  handleSendGet('a', 'a');

  return (
    <div className="list_container">
      {data.map((list: any) => (
        <button onClick={() => handleSendGet('cards_from_list', list.id)} className="list_item" key={list.id}>
          <h1>{list.name}</h1>
        </button>
      ))}
    </div>
  );
};

export default Lists;
