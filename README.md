# DoubleC Optimization and Upgrading

**Group: Double C++**

Project for Software Requirement Engineering 2022-2023, ZJU

## Technology Stack

Mongodb, Express, React, Node.js, Antd

## Usage

```shell
mkdir double-c
cd double-c
git clone https://github.com/QizW/software_DoubleC-.git
npm run install-dependencies
npm run server
# Ensure your MongoDB has been started
# Open another Terminal
npm run client
# the Web App would run on "localhost:3000"
```

## Instructions

With the work of the project DoubleC last year 
in Software Requirement Engineering, we do some optimize and upgrade
on it. Now the project DoubleC has more functions on repo analysis.

**What can DoubleC do before our work**

* User's register and login.
* User can import repos from GitHub through `Octokit` API
* Dashboard on number of commits, issues, stars, forks
* Timeline flow chart and laguage pie chart
* Only 500 commit and issue times frequency line chart
* Top 5 contributors of this repo

**What can DoubleC do after our work**

* Analysis on community of this repo include contributor activity and community devlopment
* Count all commits of this repo, and it's frequency over a period of time.
* Indicate the core contributor of this repo
* Collect company info of Pytorch's stargazer, issuer and committer and visualize it
* Collect design data of this repo and analysis it
* Get all the issues in this repo and analysis them with keywords
* Horizontal comparison between different repos
* Comparison of different periods of time in the same repo
* Support time select, zoom in and sort in charts and data 
* Improve the user system, classify users into different categories
* Enhance user security and record info of user activity