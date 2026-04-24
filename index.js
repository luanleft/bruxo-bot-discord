const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://seu-tumblr.tumblr.com']}));
app.use(express.json());

const ROLE_MAP = {
    gryffindor: process.env.ROLE_GRYFFINDOR,
    slytherin:  process.env.ROLE_SLYTHERIN,
    hufflepuff: process.env.ROLE_HUFFLEPUFF,
    ravenclaw:  process.env.ROLE_RAVENCLAW,
};

const ALL_HOUSE_ROLES = Object.values(ROLE_MAP);

app.get('/', (req, res) => res.json({ status: 'Chapéu Seletor online ⚡' }));

app.post('/assign-house', async (req, res) => {
    const { userId, house } = req.body;

    if (!userId || !house) {
        return res.status(400).json({ error: 'userId e house são obrigatórios.' });
    }

    const roleId = ROLE_MAP[house.toLowerCase()];
    if (!roleId) {
        return res.status(400).json({ error: 'Casa inválida.' });
    }

    const GUILD_ID  = process.env.GUILD_ID;
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const headers   = { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' };

    try {
        const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, { headers });
        if (!memberRes.ok) {
            return res.status(404).json({ error: 'Usuário não encontrado no servidor. Certifique-se de estar no Discord do Weasley\'s Wheezes.' });
        }
        const member = await memberRes.json();

        for (const rId of ALL_HOUSE_ROLES) {
            if (rId && member.roles.includes(rId)) {
                await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${rId}`, {
                    method: 'DELETE', headers
                });
            }
        }

        const addRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
            method: 'PUT', headers
        });

        if (!addRes.ok) {
            const err = await addRes.json();
            return res.status(500).json({ error: 'Erro ao adicionar cargo.', detail: err });
        }

        const houseName = { gryffindor:'Grifinória', slytherin:'Sonserina', hufflepuff:'Lufa-Lufa', ravenclaw:'Corvinal' };
        return res.json({ success: true, message: `Bem-vindo à ${houseName[house.toLowerCase()]}!` });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎩 Chapéu Seletor rodando na porta ${PORT}`));
