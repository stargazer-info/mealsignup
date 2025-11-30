import { SignInButton } from '@clerk/clerk-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, BarChart, Users, LogIn, Building2, Utensils, PieChart } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
            ごはんお願い
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            食事の申込み管理を、もっとシンプルに
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            誰でも、どこからでも申込み・確認が可能
          </p>
          <SignInButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-6">
              新規登録/サインイン
            </Button>
          </SignInButton>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">主な特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">どこからでもアクセス</h3>
                <p className="text-muted-foreground">
                  スマートフォン、タブレット、PCから、いつでもどこでも申込み・確認が可能です
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">リアルタイム集計</h3>
                <p className="text-muted-foreground">
                  メンバーの申込み状況を自動集計。月次サマリーで一目で把握できます
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">簡単な招待機能</h3>
                <p className="text-muted-foreground">
                  招待コードを共有するだけで、メンバーを簡単にグループに追加できます
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 使い方の流れセクション */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">使い方の流れ</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LogIn className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">新規登録/サインイン</h3>
                  </div>
                  <p className="text-muted-foreground">
                    メールアドレスまたはSNSアカウントで簡単に登録できます
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">グループを作成 or 参加</h3>
                  </div>
                  <p className="text-muted-foreground">
                    新しいグループを作成するか、招待コードで既存のグループに参加します
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">食事を申し込む</h3>
                  </div>
                  <p className="text-muted-foreground">
                    カレンダーから日付を選んで、朝食・昼食・夕食を申し込みます
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">集計を確認</h3>
                  </div>
                  <p className="text-muted-foreground">
                    グループ全体の申込み状況を月次サマリーで確認できます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッターCTA */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めましょう</h2>
          <p className="text-lg text-muted-foreground mb-8">
            食事の申込み管理を効率化して、もっと大切なことに時間を使いましょう
          </p>
          <SignInButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-6">
              新規登録/サインイン
            </Button>
          </SignInButton>
        </div>
      </section>
    </div>
  )
}
