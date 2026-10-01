import React, { useState } from "react";
import { Popconfirm, Tooltip } from "antd";
import type { PopconfirmProps, TooltipProps } from "antd";

export interface PopconfirmWithTooltipProps extends Omit<PopconfirmProps, "children"> {
  tooltipTitle: React.ReactNode;
  tooltipPlacement?: TooltipProps["placement"];
  children: React.ReactElement;
}

export const PopconfirmWithTooltip: React.FC<PopconfirmWithTooltipProps> = ({
  tooltipTitle,
  tooltipPlacement = "top",
  open: externalOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  children,
  ...popconfirmProps
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const isControlled = externalOpen !== undefined;
  const isPopOpen = isControlled ? externalOpen : internalOpen;

  const handlePopconfirmOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    if (nextOpen) {
      setTooltipOpen(false);
    }
    onOpenChange?.(nextOpen);
  };

  const handleTooltipOpenChange = (nextOpen: boolean) => {
    if (!isPopOpen) {
      setTooltipOpen(nextOpen);
    }
  };

  return (
    <Popconfirm
      {...popconfirmProps}
      open={isPopOpen}
      onOpenChange={handlePopconfirmOpenChange}
      onConfirm={(e) => {
        if (!isControlled) setInternalOpen(false);
        setTooltipOpen(false);
        onConfirm?.(e);
      }}
      onCancel={(e) => {
        if (!isControlled) setInternalOpen(false);
        setTooltipOpen(false);
        onCancel?.(e);
      }}
    >
      <Tooltip
        title={isPopOpen ? "" : tooltipTitle}
        placement={tooltipPlacement}
        open={isPopOpen ? false : tooltipOpen}
        onOpenChange={handleTooltipOpenChange}
      >
        {children}
      </Tooltip>
    </Popconfirm>
  );
};

export default PopconfirmWithTooltip;
