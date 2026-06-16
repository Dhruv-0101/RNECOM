const { createAsyncThunk } = require("@reduxjs/toolkit");

//reset error action

export const resetErrAction = createAsyncThunk("resetErr-Action", () => {
  return {};
});

export const resetAuthErrAction = createAsyncThunk(
  "resetAuthErr-Action",
  () => {
    return {};
  }
);
export const resetRegisterAuthErrAction = createAsyncThunk(
  "resetRegisterAuthErr-Action",
  () => {
    return {};
  }
);  

//reset success action

export const resetSuccessAction = createAsyncThunk(
  "resetSuccess-Action",
  () => {
    return {};
  }
);
