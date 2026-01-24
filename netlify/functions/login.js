import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import tokenStore from "./tokenStore";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hashPassword(password, Salt) {
  return crypto
    .createHash("sha256")
    .update(Salt + password)
    .digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username and password required" })
      };
    }

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("team_id, hashed_password, Salt")
      .eq("team_id", username)
      .single();

    if (error || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" })
      };
    }

    const hashedPassword = hashPassword(password, user.Salt);

    if (hashedPassword !== user.hashed_password) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" })
      };
    }

    const token = generateToken();
    tokenStore.add(token, username, 24);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token,
        username
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
