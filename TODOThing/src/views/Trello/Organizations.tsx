import React, { useState, useEffect } from 'react';

interface OrganizationsProps {
  handleSendGet: (command: string, id: string) => void;
  data: any;
}

const Organizations: React.FC<OrganizationsProps> = ({ handleSendGet, data }) => {
  const [orgs, setOrgs] = useState<any>(data);

  useEffect(() => {
    const sortedData = data.sort((a: any, b: any) => a.closed == b.closed ? 0 : !a.closed && b.closed ? 1 : -1);

    setOrgs(sortedData);
  }, [data]);

  return (
    <div className="org_container">
      {orgs.map((org: any) => (
        <button
          className="org_item"
          key={org.id}
          onClick={() => handleSendGet('boards_from_org', org.id)}
        >
          <div className="trlo_img">
            <p className="img_alt">{org.displayName.slice(0, 1)}</p>
          </div>
          <div className="org_title">
            <h1>{org.displayName}</h1>
            <p>{org.name}</p>
            <p>{' Members: ' + org.membersCount}</p>
          </div>
          <p className="org_desc">{org.desc}</p>
        </button>
      ))}
    </div>
  );
};

export default Organizations;
