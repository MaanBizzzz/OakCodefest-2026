import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  try {
    const { team_id, comment, resolved } = JSON.parse(event.body);

    if (!team_id || !comment || typeof resolved !== "boolean") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fields" })
      };
    }

    const { error } = await supabase
      .from("feedback")
      .update({ resolved })
      .eq("team_id", team_id)
      .eq("comment", comment);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
};
