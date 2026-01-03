Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    
    if (!clientId) {
      return Response.json({ error: 'Google OAuth não configurado' }, { status: 500 });
    }

    // URL base da aplicação
    const appUrl = url.origin;
    const redirectUri = `${appUrl}/api/googleOAuthCallback`;

    // Construir URL de autorização do Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'online');

    return Response.json({ 
      authUrl: authUrl.toString() 
    });
  } catch (error) {
    console.error('Erro ao iniciar OAuth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});