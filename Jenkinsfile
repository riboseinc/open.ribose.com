node() {
  deleteDir()

  stage 'Checkout'
  checkout scm

  stage 'D/L dependencies'
  withRvm('ruby-2.3.1') {
    sh 'bundle'
  }

  stage 'Build'
  sh 'rake build:production'

  stage 'Test'
  try {
    sh 'rake test:production'
  } catch (err) {
    currentBuild.result = 'UNSTABLE'
  }

  stage 'Build production'
  sh 'rake build:production'
  archive 'output/**'

  stash includes: 'output/**', name: 'built-site'
}

if (currentBuild.result == 'UNSTABLE') {
  echo 'Skipping deployment due to unstable build'
} else {

  stage 'Deploy'
  node() {
    deleteDir()
    unstash 'built-site'

    withAWS(region:'us-east-1',credentials:'cc-jenkins') {
      s3Upload(bucket:"${env.HOST}", path:'/', includePathPattern:'**/*', workingDir:'_site')
      cfInvalidate(distribution:'someDistributionId', paths:['/*'])
    }
  }
}

def withRvm(version, cl) {
  withRvm(version, "executor-${env.EXECUTOR_NUMBER}") {
    cl()
  }
}

def withRvm(version, gemset, cl) {
  RVM_HOME='$HOME/.rvm'
  paths = [
    "$RVM_HOME/gems/$version@$gemset/bin",
    "$RVM_HOME/gems/$version@global/bin",
    "$RVM_HOME/rubies/$version/bin",
    "$RVM_HOME/bin",
    "${env.PATH}"
  ]

  def path = paths.join(':')
  withEnv(["PATH=${env.PATH}:$RVM_HOME", "RVM_HOME=$RVM_HOME"]) {
    sh "set +x; source $RVM_HOME/scripts/rvm; rvm use --create --install --binary $version@$gemset"
  }

  withEnv([
    "PATH=$path",
    "GEM_HOME=$RVM_HOME/gems/$version@$gemset",
    "GEM_PATH=$RVM_HOME/gems/$version@$gemset:$RVM_HOME/gems/$version@global",
    "MY_RUBY_HOME=$RVM_HOME/rubies/$version",
    "IRBRC=$RVM_HOME/rubies/$version/.irbrc",
    "RUBY_VERSION=$version"
  ]) {
    sh 'gem install bundler'
    cl()
  }
}