using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrineGame
{
    public sealed class BrineGameController : MonoBehaviour
    {
        [Header("Shared prototype data")]
        public TextAsset gameplay;
        public TextAsset animationMap;
        public Texture2D walkingSheet;
        public Texture2D firingSheet;
        public EncounterModel Model { get; private set; }
        public Camera GameCamera { get; private set; }
        AnimationData animations;
        Sprite[] walkFrames, fireFrames;
        Sprite solid;
        SpriteRenderer body;
        GunVisuals gunVisuals;
        Transform weaponRoot, enemyRoot,stepShell; SpriteRenderer[] attachments; SpriteRenderer shield,mender,burrow,meleeRing;
        SpriteRenderer enemyBody, healthFill;
        readonly List<Transform> roadMarks = new List<Transform>();
        Pose currentPose;
        float saveTimer;
        const string SaveKey="Brine.RPG.v1";
        public static bool ValidationMode;
        string saveMessage="Saved on this device.";
        public RenderTexture BattleTexture {get;private set;}
        Transform harborScenery;HarborParallax parallax;
        public void SaveAndRefresh(){FreshVisuals();SaveProgress();}
        Sprite[] enemySprites;
        readonly List<SpriteRenderer> hostileBullets=new List<SpriteRenderer>();
        [Serializable] public class EnemyBounds { public string id; public int x,y,w,h; }
        [Serializable] public class EnemyAtlas { public EnemyBounds[] entries; }
        static long Now()=>DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        void SaveProgress(){if(Model==null||ValidationMode)return;try{PlayerPrefs.SetString(SaveKey,JsonUtility.ToJson(Model.Save(Now())));PlayerPrefs.Save();}catch(Exception){saveMessage="Saving unavailable on this device.";}}
        void OnApplicationQuit(){SaveProgress();}
        void OnApplicationPause(bool paused){if(paused)SaveProgress();else if(Model!=null&&!ValidationMode){LoadProgress();SaveProgress();}}
        void LoadProgress(){if(ValidationMode)return;try{if(PlayerPrefs.HasKey(SaveKey)){Model.Load(JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(SaveKey)),Now());if(Model.OfflineEarned>0)saveMessage="Away earnings: +"+Model.OfflineEarned+" salvage (8h cap).";}}catch(Exception){saveMessage="Could not read the saved game.";}}
        void FreshVisuals(){currentPose=BrineAnimation.Sample(Model,animations);}

        public static Vector3 World(float x, float y) => new Vector3((x - 225) / 100, (400 - y) / 100, 0);
        static Color Hex(string s) { ColorUtility.TryParseHtmlString(s, out var c); return c; }
        void Awake()
        {
#if UNITY_EDITOR
            ValidationMode = UnityEditor.SessionState.GetBool("Brine.Test", false);
#endif
            if (!gameplay) gameplay = Resources.Load<TextAsset>("gameplay");
            if (!animationMap) animationMap = Resources.Load<TextAsset>("animation");
            if (!walkingSheet) walkingSheet = Resources.Load<Texture2D>("walk");
            if (!firingSheet) firingSheet = Resources.Load<Texture2D>("fire-transparent");
            if (!gameplay || !animationMap || !walkingSheet || !firingSheet) throw new InvalidOperationException("Brine assets missing. Run Brine > Rebuild Sample Scene.");
            Model = new EncounterModel(JsonUtility.FromJson<GameplayData>(gameplay.text));
            LoadProgress(); SaveProgress();
            animations = JsonUtility.FromJson<AnimationData>(animationMap.text);
            Application.targetFrameRate = 60;
            var tex = new Texture2D(1, 1); tex.SetPixel(0, 0, Color.white); tex.Apply();
            solid = Sprite.Create(tex, new Rect(0, 0, 1, 1), Vector2.one * .5f, 1);
            GameCamera = new GameObject("Portrait Camera").AddComponent<Camera>();
            GameCamera.transform.position = new Vector3(0, 0, -10); GameCamera.orthographic = true; GameCamera.orthographicSize = 4;
            GameCamera.clearFlags = CameraClearFlags.SolidColor; GameCamera.backgroundColor = Hex("#e6c991");
            walkFrames = Slice(walkingSheet, animations.walk); fireFrames = Slice(firingSheet, animations.fire);
            fireFrames[0] = walkFrames[0]; // Identical neutral frame at both joins.
            BuildWorld(); parallax=gameObject.AddComponent<HarborParallax>();parallax.Build(); BuildCharacter(); BuildEnemy();
            BattleTexture=new RenderTexture(2160,3840,24){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,name="Harbor Portrait 4K"};GameCamera.targetTexture=BattleTexture;GameCamera.aspect=450f/800;
            // Keep Display 1 active while the battle camera feeds the Harbor UI.
            var displayCamera = new GameObject("Harbor Display Camera").AddComponent<Camera>();
            displayCamera.transform.SetParent(transform, false);
            displayCamera.clearFlags = CameraClearFlags.SolidColor;
            displayCamera.backgroundColor = Color.black;
            displayCamera.cullingMask = 0;
            displayCamera.targetDisplay = 0;
            displayCamera.depth = -100;
            gameObject.AddComponent<HarborUI>().Initialize(this);
            currentPose = BrineAnimation.Sample(Model, animations);
        }
        Sprite[] Slice(Texture2D texture, ClipData clip)
        {
            var b = BrineAnimation.Bounds(clip); var frames = new Sprite[clip.frames];
            for (int i = 0; i < frames.Length; i++)
                frames[i] = Sprite.Create(texture, new Rect(i % clip.columns * clip.cellWidth + b.x,
                    texture.height - (i / clip.columns * clip.cellHeight + b.y + b.h), b.w, b.h), new Vector2(.5f, 0), 100, 0, SpriteMeshType.FullRect);
            return frames;
        }
        SpriteRenderer Box(string name, Transform parent, float x, float y, float width, float height, string color, int order)
        {
            var go = new GameObject(name); if (parent) go.transform.SetParent(parent, false);
            var renderer = go.AddComponent<SpriteRenderer>(); renderer.sprite = solid; renderer.color = Hex(color); renderer.sortingOrder = order;
            go.transform.localPosition = parent ? new Vector3(x / 100, -y / 100, 0) : World(x, y);
            go.transform.localScale = new Vector3(width / 100, height / 100, 1); return renderer;
        }
        void BuildWorld()
        {
            var texture=Resources.Load<Texture2D>("ui/harbor-clean");
            var r=new GameObject("Approved harbor scenery").AddComponent<SpriteRenderer>();
            r.sprite=Sprite.Create(texture,new Rect(0,0,texture.width,texture.height),Vector2.one*.5f,100,0,SpriteMeshType.FullRect);r.sortingOrder=-30;
            r.transform.position=World(225,612);r.transform.localScale=new Vector3(450f/texture.width,800f/texture.height,1);harborScenery=r.transform;
        }
        void OnDestroy(){if(BattleTexture){BattleTexture.Release();Destroy(BattleTexture);}}
        void BuildCharacter()
        {
            var actor = new GameObject("Brine - interchangeable weapon").transform;
            body = new GameObject("Body").AddComponent<SpriteRenderer>(); body.transform.SetParent(actor); body.sortingOrder = 10;
            body.transform.position = World(124, 572); body.transform.localScale = Vector3.one * (120 / BrineAnimation.Common.h);
            weaponRoot = new GameObject("Weapon grip socket").transform; weaponRoot.SetParent(actor);
            gunVisuals=new GameObject("Comic gun effects").AddComponent<GunVisuals>();gunVisuals.Build(weaponRoot,Model.Settings.weapons);
            stepShell=new GameObject("Step Shell armor").transform;parallax.ShellPlate(stepShell);
            attachments=new SpriteRenderer[3];for(int i=0;i<3;i++)attachments[i]=Box("Workshop barrel band",weaponRoot,18+i*6,-14,4,13,"#d5ae68",16);
            meleeRing=Box("Melee impact",null,0,0,10,10,"#f5db99",20);
        }
        void BuildEnemy()
        {
            enemyRoot = new GameObject("Salt road creatures").transform;
            enemyBody = new GameObject("Enemy comic sprite").AddComponent<SpriteRenderer>();enemyBody.transform.SetParent(enemyRoot,false);enemyBody.sortingOrder=5;
            var atlas=JsonUtility.FromJson<EnemyAtlas>(Resources.Load<TextAsset>("enemy-atlas").text);enemySprites=new Sprite[EncounterModel.Enemies.Length];
            for(int i=0;i<enemySprites.Length;i++){var entry=Array.Find(atlas.entries,b=>b.id==EncounterModel.Enemies[i].Art);var texture=Resources.Load<Texture2D>("enemies/"+entry.id);enemySprites[i]=Sprite.Create(texture,new Rect(entry.x,texture.height-entry.y-entry.h,entry.w,entry.h),new Vector2(.5f,0),100,0,SpriteMeshType.FullRect);}
            shield=Box("Gate shield",enemyRoot,-35,-54,24,65,"#728071",7);mender=Box("Repair kit",enemyRoot,10,-70,23,25,"#214b50",7);burrow=Box("Digging blade",enemyRoot,-23,-28,27,23,"#ac8b5d",7);
            var mask=new GameObject("Enemy ground occlusion").AddComponent<SpriteMask>();mask.sprite=solid;mask.transform.position=World(225,444);mask.transform.localScale=new Vector3(4.5f,2.58f,1);mask.isCustomRangeActive=true;mask.frontSortingOrder=8;mask.backSortingOrder=0;enemyBody.maskInteraction=SpriteMaskInteraction.VisibleInsideMask;shield.maskInteraction=mender.maskInteraction=burrow.maskInteraction=SpriteMaskInteraction.VisibleInsideMask;
            healthFill = Box("Health", enemyRoot, 0, -170, 84, 5, "#536746", 7);
        }
        void Update()
        {
            if (Model == null) return;
            var muzzle = BrineAnimation.Muzzle(currentPose, Model.Equipped);
            Model.Tick(Time.deltaTime, muzzle.x+Model.MeleeAdvance, muzzle.y);
            if(!ValidationMode){saveTimer+=Time.deltaTime;if(saveTimer>5){SaveProgress();saveTimer=0;}}
            var target = BrineAnimation.Sample(Model, animations); currentPose = target;
            // Hand and weapon use exactly the displayed pose.

            body.transform.localScale = Vector3.one * (120 / BrineAnimation.Bounds(target.firing ? animations.fire : animations.walk).h);
            body.transform.localRotation = Quaternion.Euler(0,0,-target.lean*Mathf.Rad2Deg);
            body.sprite = target.firing ? fireFrames[target.frame] : walkFrames[target.frame]; body.color = Model.PlayerHit>0 ? new Color(1,.65f,.5f,1) : Color.white;
            weaponRoot.position = World(currentPose.hand.x+Model.MeleeAdvance, currentPose.hand.y);
            weaponRoot.rotation = Quaternion.Euler(0, 0, -currentPose.angle * Mathf.Rad2Deg); weaponRoot.localScale = Vector3.one*.8f;
            gunVisuals.Equip(Model.Weapon);gunVisuals.Render(Model);weaponRoot.gameObject.SetActive(!Model.UltimateActive);
            float power=Model.UltimateActive?Mathf.Min(1,(8-Model.UltimateTime)/.3f,Model.UltimateTime/.35f):0;
            float close=Model.State==EncounterState.Fight||Model.State==EncounterState.Raise?112:0;
            float punch=Model.UltimateActive?Mathf.Sin(Mathf.Min(1,Model.MeleeSince/.32f)*Mathf.PI)*16:0;
            body.transform.position=World(124+Model.MeleeAdvance+power*punch,572);stepShell.position=World(124+Model.MeleeAdvance+power*punch,490);stepShell.localScale=Vector3.one*power;
            for(int i=0;i<3;i++)attachments[i].enabled=i<Model.ModRank;
            meleeRing.enabled=Model.UltimateActive&&Model.MeleeSince<.35f;meleeRing.transform.position=World(Model.EnemyX-12,515);float strike=Mathf.Clamp01(Model.MeleeSince/.35f);meleeRing.transform.localScale=new Vector3(.05f+.4f*strike,.55f*(1-strike),1);meleeRing.transform.rotation=Quaternion.Euler(0,0,35-70*strike);
            enemyRoot.position = World(Model.EnemyX, 572);
            enemyRoot.gameObject.SetActive(Model.State != EncounterState.Reward && Model.State != EncounterState.Lower);
            enemyBody.sprite=enemySprites[Model.EnemyIndex];
            float enemyScale=Model.Enemy.Height*.78f/(enemyBody.sprite.rect.height);
            float windup=Model.State==EncounterState.Fight?Mathf.Clamp01((Model.EnemyCycle/Model.Enemy.Interval-.75f)/.25f):0;
            enemyBody.transform.localScale=new Vector3(enemyScale,enemyScale*(1-windup*.045f),1);
            float recoil=Mathf.Sin(Mathf.Min(1,Model.EnemyAttack/.32f)*Mathf.PI);enemyBody.transform.localRotation=Quaternion.Euler(0,0,-windup*5+recoil*7);enemyRoot.position=World(Model.EnemyX-recoil*(Model.Enemy.Action=="slam"?32:14),572+Model.EnemyDepth);shield.enabled=Model.Enemy.Action=="guard";shield.color=Hex(Model.Guarded?"#728071":"#9b7454");mender.enabled=Model.Enemy.Action=="repair";burrow.enabled=Model.Enemy.Action=="burrow";
            enemyBody.transform.localPosition=new Vector3(0,Model.State==EncounterState.Travel?Mathf.Sin(Model.Time*6)*.02f:0,0);
            enemyBody.color=Model.HitFlash>0?new Color(1,.75f,.55f):Color.white;
            healthFill.enabled=false;
            parallax.Render(Model.Distance);harborScenery.gameObject.SetActive(false);
            float healthRatio = Model.Health / (float)Model.MaxHealth;
            healthFill.transform.localScale = new Vector3(.84f * healthRatio, .05f, 1);
            healthFill.transform.localPosition = new Vector3(-.42f * (1 - healthRatio), (Model.Enemy.Height+25)/100, 0);
            for (int i = 0; i < roadMarks.Count; i++) roadMarks[i].position = World(i * 70 - Model.Distance % 70, 600 + i % 3 * 25);
            while(hostileBullets.Count<Model.EnemyShots.Count)hostileBullets.Add(Box("Salt clod",null,0,0,10,8,"#ae6a48",20));
            for(int i=0;i<hostileBullets.Count;i++){hostileBullets[i].enabled=i<Model.EnemyShots.Count;if(i<Model.EnemyShots.Count){var shot=Model.EnemyShots[i];bool ground=shot.weapon=="slam"||shot.weapon=="burrow";hostileBullets[i].transform.position=World(shot.x,ground?559:shot.y);hostileBullets[i].transform.localScale=new Vector3(ground?.12f:.1f,ground?.24f:.08f,1);hostileBullets[i].transform.rotation=Quaternion.Euler(0,0,ground?25:Model.Time*400);hostileBullets[i].color=Hex(shot.weapon=="burst"?"#426d68":"#ae6a48");}}
            muzzle = BrineAnimation.Muzzle(currentPose, Model.Equipped);
            GameCamera.rect=new Rect(0,0,1,1);GameCamera.aspect=450f/800;
        }
    }
}
