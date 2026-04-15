# 1. 軽量なPython環境をベースにする
FROM python:3.11-slim

# 2. 必須システムツールのインストール
RUN apt-get update && apt-get install -y curl git

# 3. Node.jsのインストール（Claude Code実行用）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 4. GitHub CLI (gh) のインストール
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh

# 5. Claude Codeのインストール
RUN npm install -g @anthropic-ai/claude-code

# 6. 超高速パッケージマネージャー「uv」のインストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# 7. 作業ディレクトリの設定
WORKDIR /workspace

# 8. 【魔法の1行】ローカルのファイルとGit設定をすべてコンテナ内に吸い込む
COPY . /workspace