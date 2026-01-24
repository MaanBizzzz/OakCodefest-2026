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
    const {
      team_id,
      project_title,
      project_description,
      repo_url
    } = JSON.parse(event.body);

    if (!team_id) {
      return { statusCode: 400 };
    }

    const updates = {};
    if (project_title !== undefined) updates.project_title = project_title;
    if (project_description !== undefined)
      updates.project_description = project_description;
    if (repo_url !== undefined) updates.repo_url = repo_url;

    const { error } = await supabase
      .from("teams")
      .update(updates)
      .eq("team_id", team_id);

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
