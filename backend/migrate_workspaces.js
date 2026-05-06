import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting Workspace Migration...');
  
  // Buscar usuários com seus workspaces (se já tiverem)
  const users = await prisma.user.findMany({
    include: {
      ownedWorkspaces: true
    }
  });

  console.log(`Found ${users.length} users to process.`);

  for (const user of users) {
    console.log(`\n👤 Processing User: ${user.name} (${user.email})`);

    let workspace = user.ownedWorkspaces[0];
    
    // 1. Criar Workspace se não existir
    if (!workspace) {
      console.log(`   ✨ Creating default workspace...`);
      workspace = await prisma.workspace.create({
        data: {
          name: `Workspace de ${user.name}`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          }
        }
      });
      console.log(`   ✅ Workspace created: ${workspace.name} (ID: ${workspace.id})`);

      // 2. Gerar API Key Default
      await prisma.apiKey.create({
        data: {
          name: 'Chave Padrão',
          key: 'sk_' + uuidv4().replace(/-/g, ''),
          workspaceId: workspace.id,
          scopes: ['read:leads', 'write:leads', 'read:conversations']
        }
      });
      console.log(`   🔑 Default API Key generated.`);
    } else {
        console.log(`   ℹ️  User already has workspace: ${workspace.name} (ID: ${workspace.id})`);
    }

    const wsId = workspace.id;

    // 3. Migrar Dados
    // Leads
    const leads = await prisma.lead.updateMany({
      where: { ownerId: user.id, workspaceId: null },
      data: { workspaceId: wsId }
    });
    if (leads.count > 0) console.log(`   📦 Migrated ${leads.count} leads.`);

    // Connections
    const conns = await prisma.connection.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: wsId }
    });
    if (conns.count > 0) console.log(`   🔗 Migrated ${conns.count} connections.`);

    // WhatsApp Conversations
    // Tenta migrar pelo ownerId (se existir) ou pelo userId se o schema antigo usava isso
    // O schema antigo tinha `userId` na conversation
    const convs = await prisma.whatsappConversation.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: wsId }
    });
    if (convs.count > 0) console.log(`   💬 Migrated ${convs.count} conversations.`);
    
    // Equipes
    const teams = await prisma.equipe.updateMany({
      where: { ownerId: user.id, workspaceId: null },
      data: { workspaceId: wsId }
    });
    if (teams.count > 0) console.log(`   👥 Migrated ${teams.count} teams.`);
    
    // Tracking Rules
    const rules = await prisma.leadTrackingRule.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: wsId }
    });
    if (rules.count > 0) console.log(`   🎯 Migrated ${rules.count} tracking rules.`);
  }

  console.log('\n✅ Migration Completed Successfully!');
}

migrate()
  .catch(e => {
      console.error('❌ Migration Error:', e);
      process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
