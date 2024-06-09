import React from 'react';
import { defaultProps } from './Trello';

const Cards: React.FC<defaultProps> = ({ handleSendGet, data }) => {
  return (
    <div className="cards_container">
      {data.map((card: any) => (
        <button
          onClick={() => handleSendGet('message', 'Card has been clicked', { id: card.id })}
          className="card_item"
          key={card.id}
        >
          <div>
            <h1>{card.name}</h1>
            <p>{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Cards;
