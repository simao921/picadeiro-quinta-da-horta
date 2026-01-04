import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Invite januariosimao7@gmail.com as admin (will change to developer after)
        await base44.users.inviteUser("januariosimao7@gmail.com", "admin");
        
        return Response.json({ 
            success: true, 
            message: "Admin invited. Login and role will be updated to developer." 
        });
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});