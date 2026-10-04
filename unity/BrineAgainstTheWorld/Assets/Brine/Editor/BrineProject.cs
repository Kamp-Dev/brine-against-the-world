using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using BrineGame;

[InitializeOnLoad]
public static class BrineProject
{
    const string ScenePath = "Assets/Brine/Scenes/SaltRoad.unity";
    static double testStart;
    static bool testing;
    static BrineProject()
    {
        EditorApplication.playModeStateChanged += state => {
            if (state == PlayModeStateChange.EnteredPlayMode && SessionState.GetBool("Brine.Test", false))
            { testing = true; testStart = EditorApplication.timeSinceStartup; EditorApplication.update += CheckPlay; }
        };
    }
    [MenuItem("Brine/Open Sample Scene")]
    public static void OpenScene()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
        if (!File.Exists(ScenePath)) CreateScene();
        EditorSceneManager.OpenScene(ScenePath);
    }
    [MenuItem("Brine/Rebuild Sample Scene")]
    public static void CreateScene()
    {
        Directory.CreateDirectory("Assets/Brine/Scenes");
        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var controller = new GameObject("Brine Game").AddComponent<BrineGameController>();
        controller.gameplay = AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Brine/Resources/gameplay.json");
        controller.animationMap = AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Brine/Resources/animation.json");
        controller.walkingSheet = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Brine/Resources/walk.png");
        controller.firingSheet = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Brine/Resources/fire-transparent.png");
        EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        PlayerSettings.companyName = "Brine Prototype"; PlayerSettings.productName = "Brine Against the World";
        PlayerSettings.defaultScreenWidth = 450; PlayerSettings.defaultScreenHeight = 800;
        PlayerSettings.defaultIsNativeResolution = false; PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
        PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
        AssetDatabase.SaveAssets();
    }
    static void Require(bool condition, string message) { if (!condition) throw new Exception("Brine test failed: " + message); }
    [MenuItem("Brine/Run Gameplay Checks")]
    public static void CheckModel()
    {
        var data = JsonUtility.FromJson<GameplayData>(AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Brine/Resources/gameplay.json").text);
        var m = new EncounterModel(data);
        for (int i = 0; i < 200 && m.State != EncounterState.Fight; i++) m.Tick(.02f, 215, 500);
        Require(m.State == EncounterState.Fight, "travel and raise reach fight");
        Require(m.ShotSerial == 0, "no shot before aiming");
        m.Paused = true; float before = m.Time; m.Tick(.1f, 215, 500); Require(m.Time == before, "pause freezes simulation"); m.Paused = false;
        for (int i = 0; i < 20 && m.Shots.Count == 0; i++) m.Tick(.01f, 215, 500);
        Require(m.Shots.Count == 1 && m.Shots[0].damage == 12, "pistol shot");
        Require(!m.Equip("repeater"), "Longshot starts locked");
        Require(m.Shots[0].damage == 12, "in-flight shot keeps old weapon damage");
        for (int i = 0; i < 500 && m.Kills == 0; i++) m.Tick(.02f, 215, 500);
        Require(m.Kills == 1 && m.Gold == 8, "single reward");
        for (int i = 0; i < 80 && m.State != EncounterState.Travel; i++) m.Tick(.02f, 215, 500);
        Require(m.Stage == 2 && m.Gold == 8 && m.State == EncounterState.Travel, "lower and continue");
        m.Reset(); Require(m.Gold == 0 && m.Stage == 1 && m.Weapon == "scrap", "reset");
        m.Gold=100; Require(m.Buy("damage") && m.Damage==16 && m.Gold==82,"damage purchase");
        Require(m.Buy("shell") && m.MaxPlayerHealth==125 && m.PlayerHealth==125,"shell purchase");
        m.Best=4;m.Xp=40;m.Stage=5;
        var save=m.Save(100000);var restored=new EncounterModel(data);
        Require(restored.Load(save,100000),"load");
        Require(restored.Stage==5 && restored.Boss && restored.Damage==18 && restored.Level==2,"save progression");
        Require(restored.Reward==64 && restored.Enemy.Name=="Sluice Keeper","boss data");
        restored.Load(save,100000+48*3600000L);Require(restored.OfflineEarned==4800,"8 hour offline cap");
        var collected=restored.Save(100000+48*3600000L);restored.Load(collected,collected.savedAt);Require(restored.OfflineEarned==0,"no repeated offline reward");
        restored.Load(save,1);Require(restored.OfflineEarned==0,"future timestamp has no payout");
        Require(restored.Equip("repeater"),"weapon unlock");
        for(int i=0;i<300 && restored.State!=EncounterState.Fight;i++)restored.Tick(.02f,215,500);
        restored.Charge=100;Require(restored.Volley() && restored.Charge==0 && !restored.Volley(),"volley consumes charge");
        int serial=restored.ShotSerial;for(int i=0;i<25;i++)restored.Tick(.02f,215,500);Require(restored.ShotSerial-serial==3,"three rapid shots");
        restored.PlayerHealth=1;
        for(int i=0;i<500 && restored.State!=EncounterState.Defeat;i++)restored.Tick(.02f,215,500);
        Require(restored.State==EncounterState.Defeat && restored.PlayerHealth==0,"enemy causes defeat");
        int bank=restored.Gold;restored.Retry();Require(restored.PlayerHealth==restored.MaxPlayerHealth && restored.Gold==bank && restored.Farming && restored.Stage==4,"retry preserves progress");
        restored.ToggleFarm();Require(restored.Stage==5 && !restored.Farming,"return to frontier");
        Debug.Log("BRINE_MODEL_CHECKS_PASS");
    }
    public static void BuildAndTest()
    {
        try { CreateScene(); CheckModel(); AnimationChecks.Run(); ExpansionChecks.Run(); SamuraiCombatChecks.Run(); SessionState.SetBool("Brine.Test", true); EditorApplication.EnterPlaymode(); }
        catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
    }
    public static void OpenAndPlay()
    {
        EditorSceneManager.OpenScene(ScenePath);
        EditorApplication.ExecuteMenuItem("Window/General/Game");
        EditorApplication.delayCall += () => EditorApplication.EnterPlaymode();
    }
    static void CheckPlay()
    {
        if (!testing || !EditorApplication.isPlaying) return;
        if (EditorApplication.timeSinceStartup - testStart < 12) return;
        testing = false; SessionState.SetBool("Brine.Test", false); EditorApplication.update -= CheckPlay;
        try
        {
            var game = UnityEngine.Object.FindFirstObjectByType<BrineGameController>();
            Require(game && game.Model != null && game.Model.Kills > 0, "Play mode completed an encounter");
            Directory.CreateDirectory("Validation");
            File.WriteAllText("Validation/play-mode.txt", "PASS: editor compiled, gameplay checks passed, play mode defeated " + game.Model.Kills + " sentries and earned " + game.Model.Gold + " salvage.\n");
            var rt = new RenderTexture(450, 800, 24);
            var previousRect = game.GameCamera.rect;
            game.GameCamera.rect = new Rect(0, 0, 1, 1);
            game.GameCamera.targetTexture = rt; game.GameCamera.aspect = 450f / 800; game.GameCamera.Render();
            RenderTexture.active = rt; var png = new Texture2D(450, 800, TextureFormat.RGB24, false); png.ReadPixels(new Rect(0, 0, 450, 800), 0, 0); png.Apply();
            File.WriteAllBytes("Validation/unity-scene.png", png.EncodeToPNG());
            game.GameCamera.targetTexture = null; game.GameCamera.rect = previousRect; game.GameCamera.ResetAspect(); RenderTexture.active = null; rt.Release();
            UnityEngine.Object.DestroyImmediate(rt); UnityEngine.Object.DestroyImmediate(png);
            Debug.Log("BRINE_PLAY_MODE_PASS"); EditorApplication.Exit(0);
        }
        catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
    }
}

public sealed class BrineTextureImport : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        if (!assetPath.StartsWith("Assets/Brine/Resources/")) return;
        var importer = (TextureImporter)assetImporter;
        importer.textureType = TextureImporterType.Default; importer.alphaIsTransparency = true;
        importer.mipmapEnabled = false; importer.filterMode = FilterMode.Bilinear;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.maxTextureSize = 4096; importer.npotScale = TextureImporterNPOTScale.None;
    }
}
