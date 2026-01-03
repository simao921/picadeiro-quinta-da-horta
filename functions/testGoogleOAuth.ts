Deno.serve(async (req) => {
  try {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    
    return Response.json({ 
      clientIdConfigured: !!clientId,
      clientSecretConfigured: !!clientSecret,
      clientIdPreview: clientId ? clientId.substring(0, 20) + '...' : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});