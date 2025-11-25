import { useState, useCallback } from "react";

export const useVerification = () => {
  const [verificationQuestion, setVerificationQuestion] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [userVerificationAnswer, setUserVerificationAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const generateVerification = useCallback(() => {
    const type = Math.random() > 0.5 ? "math" : "char";
    setUserVerificationAnswer("");
    setIsVerified(false);

    if (type === "math") {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const operations = ["+", "-", "*"];
      const operation = operations[Math.floor(Math.random() * operations.length)];

      let answer;
      switch (operation) {
        case "+":
          answer = num1 + num2;
          break;
        case "-":
          answer = num1 - num2;
          break;
        case "*":
          answer = num1 * num2;
          break;
        default:
          answer = num1 + num2;
      }

      setVerificationQuestion(`${num1} ${operation} ${num2} = ?`);
      setVerificationAnswer(answer.toString());
    } else {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setVerificationQuestion(code);
      setVerificationAnswer(code);
    }
  }, []);

  const handleVerificationChange = useCallback(
    (value, setErrors) => {
      setUserVerificationAnswer(value);
      if (value.trim() === verificationAnswer) {
        setIsVerified(true);
        if (setErrors) {
          setErrors((prev) => ({
            ...prev,
            verification: "",
          }));
        }
      } else {
        setIsVerified(false);
      }
    },
    [verificationAnswer]
  );

  const validateVerification = useCallback(() => {
    return isVerified && userVerificationAnswer.trim() === verificationAnswer;
  }, [isVerified, userVerificationAnswer, verificationAnswer]);

  const resetVerification = useCallback(() => {
    setUserVerificationAnswer("");
    setIsVerified(false);
  }, []);

  return {
    verificationQuestion,
    userVerificationAnswer,
    isVerified,
    generateVerification,
    handleVerificationChange,
    validateVerification,
    resetVerification,
  };
};

