/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface DeviceFrameProps {
  children: React.ReactNode;
}

/**
 * Desktop application frame.
 *
 * The original project rendered the student portal inside a fixed 420px phone
 * mockup. The desktop version keeps the same feature components but gives them
 * the full browser viewport so App.tsx can provide a sidebar/header workspace.
 */
export default function DeviceFrame({ children }: DeviceFrameProps) {
  return (
    <div className="student-portal-root w-full min-h-screen h-screen overflow-hidden bg-gradient-to-br from-[#F8FAFF] via-[#F5F7FD] to-[#EEF3FF] font-sans">
      {children}
    </div>
  );
}
