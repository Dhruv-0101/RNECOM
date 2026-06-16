import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { SignupFormData } from "../schemas/signup.schema";

export const useSignup = () => {
  return useMutation({
    mutationFn: (userData: SignupFormData) => authApi.register(userData),
  });
};

export default useSignup;
