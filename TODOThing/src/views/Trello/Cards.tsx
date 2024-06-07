import React from 'react';

interface CardsProps {
  handleSendGet: (command: string, id: string) => void;
  data: any;
}

const Cards: React.FC<CardsProps> = ({ handleSendGet, data }) => {
  return (
    <div className="cards_container">
      {data.map((card: any) => (
        <button onClick={() => handleSendGet('-', card.id)} className="card_item" key={card.id}>
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
