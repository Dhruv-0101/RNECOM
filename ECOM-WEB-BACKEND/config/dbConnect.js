import mongoose from "mongoose";
import dns from "dns";

const dbConnect = async () => {
  try {
    // Set DNS servers to Google and Cloudflare fallback to fix querySrv ECONNREFUSED/ENOTFOUND on local machines
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    mongoose.set("strictQuery", false);
    const connected = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Mongodb connected ${connected.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default dbConnect;
