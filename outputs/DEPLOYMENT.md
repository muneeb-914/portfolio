# Deploying This Portfolio

## Recommended Setup

Use GitHub as the code home, then deploy with either GitHub Pages or Vercel.

## GitHub Pages

1. Create a new GitHub repository, for example `portfolio`.
2. Push this whole project folder to the repository.
3. Go to the repository on GitHub.
4. Open `Settings` > `Pages`.
5. Under `Build and deployment`, set `Source` to `GitHub Actions`.
6. Push to the `main` branch.
7. GitHub Actions will deploy the `outputs` folder.

Your URL will usually look like:

```text
https://muneeb-914.github.io/portfolio/
```

If you create a special repository named `muneeb-914.github.io`, the URL becomes:

```text
https://muneeb-914.github.io/
```

## Vercel

1. Go to Vercel and choose `New Project`.
2. Import the GitHub repository.
3. Set `Root Directory` to:

```text
outputs
```

4. Leave the framework preset as static/other if Vercel does not detect one.
5. Use no build command.
6. Deploy.

Vercel will give you a URL like:

```text
https://your-project-name.vercel.app
```

## Which One To Use?

GitHub Pages is simple and free for a portfolio. Vercel is nicer when you want quick previews, custom domains, and future upgrades to React, Next.js, or API features.
