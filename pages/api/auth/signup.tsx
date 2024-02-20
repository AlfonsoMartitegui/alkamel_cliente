import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
};

const handler = (req: NextApiRequest, res: NextApiResponse<Data>) => {
  console.log("SignUp Request receviced....", req.method);
  if (req.method == "POST") {
    console.log(req.body);
    res.status(200).json({ message: "Sign Up POST" });
  }
};

export default handler;
