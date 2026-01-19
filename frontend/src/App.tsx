import React from "react";
import AppRoutes from "./routes";  // Import index.tsx directly
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";

const App = () => {
  return (
    <MaintenanceWrapper checkInterval={30000}>
      <AppRoutes />
    </MaintenanceWrapper>
  );
};

export default App;
