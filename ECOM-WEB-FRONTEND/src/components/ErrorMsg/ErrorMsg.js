import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import {
  resetAuthErrAction,
  resetErrAction,
  //resetRegisterAuthErrAction,
  resetRegisterAuthErrAction
} from "../../redux/slices/globalActions/globalActions";

const ErrorMsg = ({ message }) => {
  const dispatch = useDispatch();
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: message,
  });
  dispatch(resetRegisterAuthErrAction());
  dispatch(resetErrAction());
  dispatch(resetAuthErrAction());
};

export default ErrorMsg;
