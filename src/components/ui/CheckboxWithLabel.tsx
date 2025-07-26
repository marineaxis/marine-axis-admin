import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export const CheckboxWithLabel = ({
  label,
  ...props
}: React.ComponentProps<typeof Checkbox> & { label: string }) => (
  <label className="flex items-center space-x-2 cursor-pointer">
    <Checkbox {...props} />
    <span>{label}</span>
  </label>
);
