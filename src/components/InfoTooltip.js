import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaInfoCircle } from "react-icons/fa";

const InfoTooltip = ({ message }) => {
  return (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip>{message}</Tooltip>}
    >
      <span style={{ cursor: "pointer", marginLeft: "5px" }}>
        <FaInfoCircle color="blue" />
      </span>
    </OverlayTrigger>
  );
};

export default InfoTooltip;