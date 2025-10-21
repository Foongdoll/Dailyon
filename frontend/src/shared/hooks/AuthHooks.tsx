import { useState } from "react";

const useAuth = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");


    return {email, setEmail, password, setPassword}   
}

export default useAuth;