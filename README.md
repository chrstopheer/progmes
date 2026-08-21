Aplicação para facilitar a programação e o compartilhamento das atividades mensais da organização não governamental Brasil Soka Gakkai Internacional.
## Autenticação e persistência

A branch `login` usa Firebase Authentication com o provedor Google e Cloud Firestore. As atividades e configurações são salvas no documento `users/{uid}`, de modo que cada conta tenha seus próprios dados. O adaptador também faz uma migração única dos dados legados encontrados no `localStorage` quando a conta é autenticada pela primeira vez.

Para configurar localmente, copie `frontend/.env.example` para `frontend/.env`, preencha as variáveis com as credenciais do app Web no Firebase Console e habilite **Authentication > Sign-in method > Google**. Crie o banco Cloud Firestore e publique as regras de `firestore.rules`. Depois execute `yarn install` e `yarn start` dentro de `frontend`.

As variáveis `REACT_APP_FIREBASE_*` são configurações públicas do app Web e não substituem as regras de segurança. O isolamento real dos dados é feito pelas regras do Firestore, que permitem acesso apenas quando o UID autenticado coincide com o documento solicitado.
