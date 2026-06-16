import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { resetSuccessAction } from "../../redux/slices/globalActions/globalActions";
import { updateProductAction } from "../../redux/slices/products/productSlices";

const SuccessMsg = ({ message }) => {
  const dispatch = useDispatch();

  Swal.fire({
    icon: "success",
    title: "Good job!",
    text: message,
  });
  dispatch(resetSuccessAction());
  dispatch(updateProductAction())
};

export default SuccessMsg;
