# ����� ���ڷ� ���͵�

�����ڴ� �⼮�ο� ��ŷ�� ��ȸ�ϰ�, �����ڸ� �α��� �� �⼮ üũ����Ҹ� �� �� �ֽ��ϴ�.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/abcdahyun/snu-jibak-study)

## ����

�� ��ư�� ���� Cloudflare �������� �α����մϴ�. ���� ȭ�鿡�� `ADMIN_PASSWORD`�� �����ڸ� �˰� �ִ� **20�� �̻��� ������ ��й�ȣ**�� �Է��ϼ���. ���� ��й�ȣ�� �ҽ� �ڵ忡 ���� �ʽ��ϴ�. �⺻ ��й�ȣ�� �����ϴ�. ��й�ȣ�� ���ų� �ʹ� ª���� �⼮ ������ ���ܵ˴ϴ�.

�� ��ư�� ����Ҹ� �����ϰ� Worker�� D1 �����ͺ��̽��� �����մϴ�. �����Ǵ� ����� �̸��� ���� ����ҿ� �ٸ� �̸�(��: `snu-jibak-study-live`)�� ����ϼ���. ���� ���� ������ ������ ����� ����ҿ� �ݿ��ؾ� �մϴ�.

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- DB ���̱׷��̼��� deploy ���ɿ� ���Ե˴ϴ�.
- `wrangler.jsonc`�� 0���� ä�� database_id�� ���� ��ư�� ���� ID�� �ٲٴ� �ڸ�ǥ�����Դϴ�. ���� CLI ���� �ÿ��� ���� D1 ID�� �Է��ؾ� �մϴ�.

���� ����Ҹ� �״�� �����Ϸ��� Cloudflare Workers & Pages���� GitHub ����Ҹ� ��������, D1�� �����Ͽ� ������ database_id�� ���� ID�� �ٲ� ���� �� ������ ����մϴ�. `ADMIN_PASSWORD`�� Worker�� ��ȣȭ�� Secret���� �����ϼ���.

## ������ ����

- ������ ��й�ȣ�� ���� Secret���� �����մϴ�.
- ������ ��� �⼮ ���� ��û�� �α��� ������ �˻��մϴ�.
- ������ 8�ð� �� �����ϸ� Secure/HttpOnly/SameSite ��Ű�� ����մϴ�.
- �α׾ƿ��� ���� ���ǵ� �����մϴ�. ��й�ȣ ���� �� ���� ���ǵ� ��ȿȭ�˴ϴ�.
- �α��� �õ��� IP�� �д� 5ȸ�� �����մϴ�.
- �����ڿ� ȸ�������̳� ������ ���� �ο� ����� �����ϴ�.
- �⼮�ο� ��ŷ(�̸����а� ����)�� ���� ��ȸ���Դϴ�.

## ���� �� ����

Node.js 22.13 �̻��� �ʿ��մϴ�. `npm install` �� `.dev.vars.example`�� `.dev.vars`�� �����ϰ� ���� ������ ��й�ȣ�� �����ϼ���.

```sh
npm test
npm run build
npm run dev
```

���� Sites ������Ʈ�� ���� �⼮ DB, ���������� ���ε����� �ʽ��ϴ�. �� Cloudflare �����ͺ��̽��� �⼮ ����� �� ���·� �����մϴ�.

���� ���� �ȳ�: https://developers.cloudflare.com/workers/platform/deploy-buttons/

