import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const { team_id } = JSON.parse(event.body);

    if (!team_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing team_id" })
      };
    }

    // Fetch team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("team_id", team_id)
      .single();

    if (teamError) throw teamError;

    // Fetch feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .select("*")
      .eq("team_id", team_id)
      .order("priority");

    if (feedbackError) throw feedbackError;

    let leaderboard = [];
    const currentTeam = Number(team.category);

    const { data, error } = await supabase
      .from("teams")
      .select("team_id, team_name, points")
      .eq("category", currentTeam)
      .order("points", { ascending: false });

    if (error) throw error;
    leaderboard = data;

    return {
      statusCode: 200,
      body: JSON.stringify({ team, feedback, leaderboard })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
