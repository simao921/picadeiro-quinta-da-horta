import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return Response.json({ error: 'Código de autorização não fornecido' }, { status: 400 });
    }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'Google OAuth não configurado' }, { status: 500 });
    }

    const appUrl = url.origin;
    const redirectUri = `${appUrl}/api/googleOAuthCallback`;

    // Trocar código por access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Erro ao trocar código:', error);
      return Response.json({ error: 'Falha ao obter token' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Obter informações do utilizador
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return Response.json({ error: 'Falha ao obter informações do utilizador' }, { status: 400 });
    }

    const userInfo = await userInfoResponse.json();

    // Criar/atualizar utilizador no Base44
    const base44 = createClientFromRequest(req);
    
    // Verificar se utilizador já existe
    const existingUsers = await base44.asServiceRole.entities.User.filter({ 
      email: userInfo.email 
    });

    let user;
    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0];
      // Atualizar informações se necessário
      if (!user.full_name && userInfo.name) {
        await base44.asServiceRole.entities.User.update(user.id, {
          full_name: userInfo.name
        });
      }
    } else {
      // Criar novo utilizador
      user = await base44.asServiceRole.entities.User.create({
        email: userInfo.email,
        full_name: userInfo.name || userInfo.email,
        role: 'user'
      });
    }

    // Redirecionar para a página principal com sucesso
    const homeUrl = `${appUrl}?googleLogin=success&email=${encodeURIComponent(userInfo.email)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': homeUrl,
      },
    });
  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});