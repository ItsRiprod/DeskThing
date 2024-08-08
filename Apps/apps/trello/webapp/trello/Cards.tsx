import React, { useEffect, useState } from 'react';
import { defaultProps } from './index.tsx';

const Cards: React.FC<defaultProps> = ({ handleSendGet, data }) => {
  const [labels, setLabels] = useState<Map<string, any>>();

  useEffect(() => {
    if (data.data[0]) {
      handleSendGet('get', 'labels_from_board', { id: data.data[0].idBoard });
    }
  }, []);
  useEffect(() => {
    if (data.labels) {
      const labelsMap = new Map<string, any>(
        data.labels.map((label: any) => [label.id, { color: label.color, name: label.name }])
      );
      setLabels(labelsMap);
    }
    console.log('Cur Data', data);
  }, [data]);
  return (
    <div className="cards_container">
      {data.data.map((card: any) => (
        <button
          onClick={() => handleSendGet('message', 'Card has been clicked', { id: card.id })}
          className="card_item"
          key={card.id}
        >
          <div className="card_details">
            <h1>{card.name}</h1>
            <p>{card.desc}</p>
          </div>
          <div className="card_labels">
            {card.idLabels.map((label: any) => (
              <div
                key={label}
                className="card_label"
                style={{
                  backgroundColor: `var(--trello-color-${labels?.get(label).color || 'gray'})`,
                }}
              >
                {labels?.get(label).name}
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
};

export default Cards;
