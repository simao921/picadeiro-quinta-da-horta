import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Invite januariosimao7@gmail.com as developer
        await base44.users.inviteUser("januariosimao7@gmail.com", "developer");
        
        return Response.json({ 
            success: true, 
            message: "Developer invited successfully" 
        });
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});